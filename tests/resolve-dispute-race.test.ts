import { describe, expect, it } from "vitest";

import { POST } from "@/app/api/disputes/[id]/resolve/route";
import { PLAN_PRICE_CENTS, type PlanId } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

const ENV_KEYS = [
  "DEMO_BUGS",
  "DEMO_SCENARIO",
  "DEMO_BUGS_FILE",
  "NEXT_PUBLIC_DEMO_BUGS",
  "NEXT_PUBLIC_DEMO_SCENARIO",
] as const;

/**
 * Credit left on the open row before either resolve runs.
 * Accept must replace it with the catalog cap. Decline must leave it.
 * 100 cents is a fixture, not a catalog price.
 */
const PRIOR_CREDIT_CENTS = 100;

const ACCEPT_NOTE = "Accept the credit.";
const DECLINE_NOTE = "Decline the dispute.";

type ResolveAction = "accept" | "decline";

type StoredDecision = {
  status: string;
  suggestedCreditCents: number;
  reviewerNote: string | null;
};

type WriteDelegate = {
  update: (args: unknown, ...rest: unknown[]) => Promise<unknown>;
  updateMany: (args: unknown, ...rest: unknown[]) => Promise<unknown>;
};

function post(id: string, action: ResolveAction) {
  const reviewerNote = action === "accept" ? ACCEPT_NOTE : DECLINE_NOTE;
  return POST(
    new Request(`http://localhost/api/disputes/${id}/resolve`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, reviewerNote }),
    }),
    { params: Promise.resolve({ id }) },
  );
}

async function readResponse(response: Response) {
  return {
    httpStatus: response.status,
    body: (await response.json()) as {
      ok?: boolean;
      disputeId?: string;
      status?: string;
      suggestedCreditCents?: number;
      error?: string;
    },
  };
}

async function snapshot(id: string): Promise<StoredDecision> {
  const dispute = await prisma.dispute.findUniqueOrThrow({ where: { id } });
  return {
    status: dispute.status,
    suggestedCreditCents: dispute.suggestedCreditCents,
    reviewerNote: dispute.reviewerNote,
  };
}

async function restore(id: string, row: StoredDecision) {
  await prisma.dispute.update({ where: { id }, data: row });
}

async function withDefaultBugs(fn: () => Promise<void>) {
  const previous = new Map<string, string | undefined>();
  for (const key of ENV_KEYS) previous.set(key, process.env[key]);
  for (const key of ENV_KEYS) delete process.env[key];
  try {
    await fn();
  } finally {
    for (const key of ENV_KEYS) {
      const value = previous.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

/**
 * Suspend the first write for this dispute until `release` is called.
 * Reads are not delayed. The write still runs through Prisma against SQLite.
 * A second status read that happens before the write does not satisfy the
 * test: the other resolve commits while this write is still waiting.
 */
function holdFirstDisputeWrite(disputeId: string) {
  const originals: Array<{ owner: object; key: string; value: unknown }> = [];
  let waiting = false;
  let notifyHeld: () => void = () => {};
  const held = new Promise<void>((resolve) => {
    notifyHeld = resolve;
  });
  let openGate: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    openGate = resolve;
  });
  let released = false;

  function remember(owner: object, key: string) {
    if (originals.some((entry) => entry.owner === owner && entry.key === key)) return;
    originals.push({ owner, key, value: Reflect.get(owner, key) });
  }

  function whereId(args: unknown): string | undefined {
    if (!args || typeof args !== "object") return undefined;
    const where = (args as { where?: unknown }).where;
    if (!where || typeof where !== "object") return undefined;
    const id = (where as { id?: unknown }).id;
    return typeof id === "string" ? id : undefined;
  }

  function argsMentionDispute(args: unknown[]): boolean {
    try {
      return JSON.stringify(args).includes(disputeId);
    } catch {
      return false;
    }
  }

  async function waitIfFirstWrite(matches: boolean) {
    if (!matches || waiting || released) return;
    waiting = true;
    notifyHeld();
    await gate;
  }

  function wrapDelegate(delegate: WriteDelegate) {
    remember(delegate, "update");
    remember(delegate, "updateMany");
    const originalUpdate = delegate.update;
    const originalUpdateMany = delegate.updateMany;
    delegate.update = async function (args: unknown, ...rest: unknown[]) {
      await waitIfFirstWrite(whereId(args) === disputeId);
      return originalUpdate.call(delegate, args, ...rest);
    };
    delegate.updateMany = async function (args: unknown, ...rest: unknown[]) {
      await waitIfFirstWrite(whereId(args) === disputeId);
      return originalUpdateMany.call(delegate, args, ...rest);
    };
  }

  function wrapRaw(owner: object, key: "$executeRaw" | "$executeRawUnsafe") {
    const current = Reflect.get(owner, key);
    if (typeof current !== "function") return;
    remember(owner, key);
    const original = current.bind(owner);
    Reflect.set(owner, key, async (...args: unknown[]) => {
      await waitIfFirstWrite(argsMentionDispute(args));
      return original(...args);
    });
  }

  wrapDelegate(prisma.dispute as unknown as WriteDelegate);
  wrapRaw(prisma, "$executeRaw");
  wrapRaw(prisma, "$executeRawUnsafe");

  remember(prisma, "$transaction");
  const originalTransaction = prisma.$transaction.bind(prisma);
  Reflect.set(prisma, "$transaction", (async (...args: unknown[]) => {
    const fn = args[0];
    if (typeof fn !== "function") {
      return originalTransaction(...(args as Parameters<typeof prisma.$transaction>));
    }
    const options = args[1];
    return originalTransaction(async (tx) => {
      wrapDelegate(tx.dispute as unknown as WriteDelegate);
      wrapRaw(tx, "$executeRaw");
      wrapRaw(tx, "$executeRawUnsafe");
      return fn(tx);
    }, options as never);
  }) as typeof prisma.$transaction);

  return {
    held,
    release() {
      released = true;
      openGate();
    },
    restore() {
      released = true;
      openGate();
      for (const entry of originals.reverse()) {
        Reflect.set(entry.owner, entry.key, entry.value);
      }
      originals.length = 0;
    },
  };
}

async function settle<T>(promise: Promise<T>, ms: number): Promise<{ done: true; value: T } | { done: false }> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<{ done: false }>((resolve) => {
    timer = setTimeout(() => resolve({ done: false }), ms);
  });
  const outcome = await Promise.race([
    promise.then((value) => ({ done: true as const, value })),
    timeout,
  ]);
  if (timer) clearTimeout(timer);
  return outcome;
}

describe("overlapping dispute resolve", () => {
  const cases: Array<{
    id: string;
    openStatus: "OPEN" | "NEEDS_REVIEW";
    plan: PlanId;
    first: ResolveAction;
    second: ResolveAction;
  }> = [
    { id: "dsp_1041", openStatus: "OPEN", plan: "GROWTH", first: "accept", second: "decline" },
    { id: "dsp_1041", openStatus: "OPEN", plan: "GROWTH", first: "decline", second: "accept" },
    { id: "dsp_1049", openStatus: "NEEDS_REVIEW", plan: "SCALE", first: "accept", second: "decline" },
    { id: "dsp_1049", openStatus: "NEEDS_REVIEW", plan: "SCALE", first: "decline", second: "accept" },
  ];

  it.each(cases)(
    "$id ($openStatus): $second commits while $first is between its status check and its write",
    async ({ id, openStatus, plan, first, second }) => {
      const before = await snapshot(id);
      const inFlight: Promise<unknown>[] = [];
      let barrier: ReturnType<typeof holdFirstDisputeWrite> | undefined;
      try {
        await withDefaultBugs(async () => {
          await prisma.dispute.update({
            where: { id },
            data: {
              status: openStatus,
              suggestedCreditCents: PRIOR_CREDIT_CENTS,
              reviewerNote: null,
            },
          });

          barrier = holdFirstDisputeWrite(id);
          const firstPromise = post(id, first).then(readResponse);
          inFlight.push(firstPromise);
          const reachedWrite = await settle(barrier.held, 3_000);
          expect(reachedWrite.done, `${first} never reached a dispute write`).toBe(true);

          const secondPromise = post(id, second).then(readResponse);
          inFlight.push(secondPromise);
          // The second call shares the same open row. Give it time to commit
          // before the suspended write runs. A write lock held across the
          // check and the write makes this wait time out; release then, and
          // the second call has to observe the committed decision.
          const secondWhileHeld = await settle(secondPromise, 2_000);
          barrier.release();
          const firstResult = await firstPromise;
          const secondResult = secondWhileHeld.done ? secondWhileHeld.value : await secondPromise;
          const stored = await snapshot(id);

          const results = [
            { action: first, ...firstResult },
            { action: second, ...secondResult },
          ];
          const successes = results.filter((result) => result.httpStatus === 200);
          const conflicts = results.filter((result) => result.httpStatus === 409);
          expect(
            results.map((result) => result.httpStatus),
            `both resolves returned success for ${id}: ${JSON.stringify(results)} stored=${JSON.stringify(stored)}`,
          ).toEqual(expect.arrayContaining([200, 409]));
          expect(successes).toHaveLength(1);
          expect(conflicts).toHaveLength(1);

          const winner = successes[0];
          expect(winner.body.ok).toBe(true);
          expect(winner.body.disputeId).toBe(id);
          expect(winner.body.status).toBe(winner.action === "accept" ? "ACCEPTED" : "DECLINED");
          expect(stored.status).toBe(winner.body.status);
          expect(stored.suggestedCreditCents).toBe(winner.body.suggestedCreditCents);
          if (winner.action === "accept") {
            expect(stored.suggestedCreditCents).toBe(PLAN_PRICE_CENTS[plan]);
            expect(stored.reviewerNote).toBe(ACCEPT_NOTE);
          } else {
            expect(stored.suggestedCreditCents).toBe(PRIOR_CREDIT_CENTS);
            expect(stored.reviewerNote).toBe(DECLINE_NOTE);
          }
          expect(conflicts[0].body.error).toMatch(new RegExp(`Dispute ${id} is already`));
          expect(stored.status).not.toBe(conflicts[0].action === "accept" ? "ACCEPTED" : "DECLINED");
        });
      } finally {
        barrier?.release();
        await Promise.allSettled(inFlight);
        barrier?.restore();
        await restore(id, before);
      }
    },
  );
});
