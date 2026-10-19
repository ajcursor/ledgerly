import { RUNBOOK_SECTIONS_101 } from "@/runbooks/beats/101";
import { RUNBOOK_SECTIONS_201 } from "@/runbooks/beats/201";
import { RUNBOOK_SECTIONS_301 } from "@/runbooks/beats/301";
import type { DemoSection, DemoTrack } from "@/runbooks/types";

export const RUNBOOK_TRACKS = [
  {
    id: "101" as const,
    title: "101",
    description:
      "You will explore different ways to work in Grok Build, use modes and models for the right tasks, apply rules and skills to ensure consistent quality, and complete at least one task with an agent.",
    sections: RUNBOOK_SECTIONS_101,
  },
  {
    id: "201" as const,
    title: "201",
    description:
      "You will curate what belongs in an agent's context, encode conventions as project skills, connect a curated set of MCP servers, and split one task across parallel agents.",
    sections: RUNBOOK_SECTIONS_201,
  },
  {
    id: "301" as const,
    title: "301",
    description:
      "You will orchestrate work across agents, tasks, and coworkers: break tasks down for multiple agents, take a plan through parallel agents to a reviewable PR, scale review when several streams finish, and share ownership safely.",
    sections: RUNBOOK_SECTIONS_301,
  },
] as const satisfies readonly {
  id: DemoTrack;
  title: string;
  description: string;
  sections: readonly DemoSection[];
}[];

export type RunbookTrack = (typeof RUNBOOK_TRACKS)[number];

export function getRunbookTrack(track: string): RunbookTrack | undefined {
  return RUNBOOK_TRACKS.find((entry) => entry.id === track);
}

/** Distinct optional features on a track, in first-seen order. */
export function trackOptionalFeatures(track: RunbookTrack): string[] {
  const seen: string[] = [];
  for (const section of track.sections) {
    for (const beat of section.beats) {
      const feature = "optional" in beat ? beat.optional?.feature : undefined;
      if (feature && !seen.includes(feature)) seen.push(feature);
    }
  }
  return seen;
}
