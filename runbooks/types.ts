export type DemoTrack = "101" | "201" | "301";

export type BeatPromptType = "reusable" | "adaptable" | "none";

/** Feature name copied from an `[Optional - Feature]` tag. */
export type OptionalFeature = {
  feature: string;
};

/** A Do line or prompt that follows the beat's main prompt. */
export type BeatFollowUp =
  | { kind: "do"; text: string }
  | { kind: "prompt"; text: string; promptType?: BeatPromptType; pasteLabel?: string };

export type DemoBeat = {
  id: string;
  title: string;
  /** Say copy. Shown above the steps. */
  say?: string;
  /** Do copy. One step per line, shown before the prompt. */
  detail: string;
  promptType?: BeatPromptType;
  example?: string;
  pasteLabel?: string;
  /**
   * Do lines and prompts that come after `example`, in order.
   * A Do line that sits between prompts stays between them.
   */
  after?: readonly BeatFollowUp[];
  /**
   * Set on beats the Outline marks `[Optional - Feature]`.
   * The runbooks page can hide every beat for one feature.
   * Required beats omit this.
   */
  optional?: OptionalFeature;
};

export type DemoSection = {
  id: string;
  title: string;
  beats: readonly DemoBeat[];
};
