const OPTIONAL_TAG = /\[Optional\s*-\s*([^\]]+?)\]/g;

/**
 * Pull `[Optional - Feature]` tags out of beat copy.
 * The feature name is stored on the beat. The tag is not shown in the prompt.
 * Text with no tag is returned unchanged.
 */
export function stripOptionalTags(value: string): { text: string; features: string[] } {
  if (!value.includes("[Optional")) return { text: value, features: [] };
  const features: string[] = [];
  const text = value
    .replace(OPTIONAL_TAG, (_match, name: string) => {
      features.push(name.trim());
      return "";
    })
    .replace(/[ \t]{2,}/g, " ")
    .replace(/^[ \t]+|[ \t]+$/gm, "")
    .trim();
  return { text, features };
}
