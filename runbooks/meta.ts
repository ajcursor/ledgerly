/**
 * Grok Build runbooks as they appear in runbooks.html and in the README.
 * The 101, 201, and 301 tracks are shipped; their beats are the source of truth.
 */

export * from "@/runbooks/types";
export { RUNBOOK_SECTIONS_101 } from "@/runbooks/beats/101";
export { RUNBOOK_SECTIONS_201 } from "@/runbooks/beats/201";
export { RUNBOOK_SECTIONS_301 } from "@/runbooks/beats/301";
export { PROJECT_AGENTS, PROJECT_SKILLS } from "@/runbooks/agents";
export {
  RUNBOOK_TRACKS,
  getRunbookTrack,
  trackOptionalFeatures,
  type RunbookTrack,
} from "@/runbooks/tracks";
export { stripOptionalTags } from "@/runbooks/optional-tag";
export {
  FIELD_DEMO_FILTER_TITLE,
  FIELD_DEMO_ISSUES,
  FIELD_DEMO_SUGGESTED_CREDIT_TITLE,
  LINEAR_FIELD_DEMOS_PROJECT,
} from "@/runbooks/linear-field-demos";
export {
  runbookBeatSequence,
  runbookBeats,
  runbookSectionHref,
  runbookTrackHref,
} from "@/runbooks/catalog";
