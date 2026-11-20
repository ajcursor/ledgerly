import { randomUUID } from "node:crypto";
import { readFile, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

/**
 * Card edits from runbooks.html, stored in runbooks/edits.json so they survive a
 * dev server restart and travel with a git commit. This route only ever reads
 * and writes that one file; the request never supplies a path.
 *
 * Shape: { "<track>:<beatId>": { "title" | "step-N" | "prompt-N": "text" } }
 */
export const dynamic = "force-dynamic";

const EDITS_PATH = join(process.cwd(), "runbooks", "edits.json");
const BEAT_KEY = /^(101|201|301):[a-z0-9-]+$/;
const FIELD_NAME = /^(title|step-\d{1,3}|prompt-\d{1,3})$/;
// Tab, newline, and carriage return are allowed in prompts. Other control characters are not.
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const MAX_VALUE_LENGTH = 4000;
const MAX_BEATS = 200;
const MAX_FIELDS_PER_BEAT = 50;
const MAX_BODY_BYTES = 256 * 1024;

/**
 * Origins that may call this route from a browser. `null` is the origin of a
 * file:// page or a Canvas srcdoc frame. Requests without an Origin header come
 * from same-machine tools such as curl and are allowed. Any other origin gets a 403
 * and no CORS headers, so a random website cannot write the file.
 */
const ALLOWED_ORIGINS = new Set(["null", "http://localhost:43173", "http://127.0.0.1:43173"]);

type Edits = Record<string, Record<string, string>>;
type Validation = { ok: true; edits: Edits } | { ok: false; error: string };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function fieldOrder(field: string): number {
  if (field === "title") return 0;
  const [kind, index] = field.split("-");
  return (kind === "step" ? 1 : 2) * 10000 + Number(index);
}

function validateEdits(value: unknown): Validation {
  if (!isPlainObject(value)) return { ok: false, error: "Body must be a JSON object keyed by track:beat." };
  const beatKeys = Object.keys(value);
  if (beatKeys.length > MAX_BEATS) return { ok: false, error: `At most ${MAX_BEATS} beats can be edited.` };

  const edits: Edits = {};
  for (const beatKey of beatKeys.sort()) {
    if (!BEAT_KEY.test(beatKey)) return { ok: false, error: "Invalid beat key. Use <track>:<beat-id>." };
    const fields = value[beatKey];
    if (!isPlainObject(fields)) return { ok: false, error: `Fields for ${beatKey} must be an object.` };
    const fieldNames = Object.keys(fields);
    if (fieldNames.length > MAX_FIELDS_PER_BEAT) {
      return { ok: false, error: `At most ${MAX_FIELDS_PER_BEAT} fields per beat.` };
    }

    const out: Record<string, string> = {};
    for (const field of fieldNames.sort((a, b) => fieldOrder(a) - fieldOrder(b))) {
      if (!FIELD_NAME.test(field)) return { ok: false, error: `Invalid field name on ${beatKey}.` };
      const text = fields[field];
      if (typeof text !== "string" || text.trim() === "") {
        return { ok: false, error: `Value for ${beatKey} ${field} must be a non-empty string.` };
      }
      if (text.length > MAX_VALUE_LENGTH) {
        return { ok: false, error: `Value for ${beatKey} ${field} is longer than ${MAX_VALUE_LENGTH} characters.` };
      }
      if (CONTROL_CHARS.test(text)) return { ok: false, error: `Value for ${beatKey} ${field} has control characters.` };
      out[field] = text;
    }
    if (fieldNames.length > 0) edits[beatKey] = out;
  }
  return { ok: true, edits };
}

async function readEdits(): Promise<Edits> {
  let raw: string;
  try {
    raw = await readFile(EDITS_PATH, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw error;
  }
  const result = validateEdits(JSON.parse(raw));
  if (!result.ok) throw new Error(`runbooks/edits.json is invalid: ${result.error}`);
  return result.edits;
}

// Writes run one at a time so two quick saves cannot interleave.
let writeQueue: Promise<void> = Promise.resolve();

function writeEdits(edits: Edits): Promise<void> {
  const next = writeQueue.then(async () => {
    const tmp = `${EDITS_PATH}.${randomUUID()}.tmp`;
    try {
      await writeFile(tmp, `${JSON.stringify(edits, null, 2)}\n`, "utf8");
      await rename(tmp, EDITS_PATH);
    } catch (error) {
      await rm(tmp, { force: true });
      throw error;
    }
  });
  writeQueue = next.catch(() => undefined);
  return next;
}

function corsHeaders(request: Request): Headers | null {
  const headers = new Headers({ "Cache-Control": "no-store", Vary: "Origin" });
  const origin = request.headers.get("origin");
  if (origin === null) return headers;
  if (!ALLOWED_ORIGINS.has(origin)) return null;
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  // Lets a public-network page reach localhost in Chrome's Private Network Access rules.
  headers.set("Access-Control-Allow-Private-Network", "true");
  return headers;
}

function forbidden(): NextResponse {
  return NextResponse.json({ error: "Origin not allowed." }, { status: 403 });
}

export async function OPTIONS(request: Request) {
  const headers = corsHeaders(request);
  if (!headers) return forbidden();
  return new NextResponse(null, { status: 204, headers });
}

export async function GET(request: Request) {
  const headers = corsHeaders(request);
  if (!headers) return forbidden();
  try {
    return NextResponse.json(await readEdits(), { headers });
  } catch {
    return NextResponse.json({ error: "runbooks/edits.json could not be read." }, { status: 500, headers });
  }
}

export async function PUT(request: Request) {
  const headers = corsHeaders(request);
  if (!headers) return forbidden();

  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return NextResponse.json({ error: "Content-Type must be application/json." }, { status: 415, headers });
  }
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Body is too large." }, { status: 413, headers });
  }

  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Body is too large." }, { status: 413, headers });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Body is not valid JSON." }, { status: 400, headers });
  }

  const result = validateEdits(parsed);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400, headers });

  try {
    await writeEdits(result.edits);
  } catch {
    return NextResponse.json({ error: "runbooks/edits.json could not be written." }, { status: 500, headers });
  }
  return NextResponse.json(result.edits, { headers });
}
