import { readFileSync } from "node:fs";
import path from "node:path";

export const MIN_TEXT_CONTRAST = 4.5;

export type Theme = "light" | "dark";

function readBlock(css: string, selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`No ${selector} block in globals.css`);
  const body = css.slice(start, css.indexOf("}", start));
  const tokens: Record<string, string> = {};
  for (const match of body.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    tokens[match[1]] = match[2].trim();
  }
  return tokens;
}

export function loadThemeTokens(): Record<Theme, Record<string, string>> {
  const css = readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");
  const light = readBlock(css, ":root");
  return { light, dark: { ...light, ...readBlock(css, ".dark") } };
}

export function resolveColor(tokens: Record<string, string>, value: string): string {
  let current = value;
  for (let depth = 0; depth < 10; depth += 1) {
    const ref = current.match(/^var\(--([\w-]+)\)$/);
    if (!ref) break;
    current = tokens[ref[1]];
    if (current === undefined) throw new Error(`Unknown token --${ref[1]}`);
  }
  if (!/^#[0-9a-f]{6}$/i.test(current)) {
    throw new Error(`Expected a 6-digit hex color for ${value}, got ${current}`);
  }
  return current.toLowerCase();
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

const LABEL_ATTRS = /\baria-label(ledby)?=/;

function visibleText(html: string): string {
  return html
    .replace(/<svg[\s\S]*?<\/svg>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;|\s+/g, " ")
    .trim();
}

/**
 * Checks React-rendered static markup. React output is well formed, so tag-level
 * matching is enough here; nested buttons or links are not valid HTML anyway.
 */
export function findUnlabeledInMarkup(html: string): string[] {
  const problems: string[] = [];
  const labelFor = new Set([...html.matchAll(/<label[^>]*\bfor="([^"]+)"/g)].map((m) => m[1]));

  for (const match of html.matchAll(/<(input|textarea|select)\b[^>]*>/g)) {
    const tag = match[0];
    if (/\btype="hidden"/.test(tag) || LABEL_ATTRS.test(tag)) continue;
    const id = tag.match(/\bid="([^"]+)"/)?.[1];
    if (id && labelFor.has(id)) continue;
    problems.push(`<${match[1]}> has no label: ${tag}`);
  }

  for (const match of html.matchAll(/<(button|a)\b([^>]*)>([\s\S]*?)<\/\1>/g)) {
    const [, element, attributes, inner] = match;
    if (LABEL_ATTRS.test(attributes) || /\btitle="[^"]+"/.test(attributes)) continue;
    if (visibleText(inner) || /<img\b[^>]*\balt="[^"]+"/.test(inner)) continue;
    problems.push(`<${element}> has no accessible name: <${element}${attributes}>`);
  }

  for (const match of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\balt="/.test(match[0])) problems.push(`<img> has no alt: ${match[0]}`);
  }

  return problems;
}

const FORM_CONTROL = /<(input|Input|textarea|Textarea|select|Select)\b[\s\S]*?(?:\/>|<\/\1>)/g;

/**
 * Source-level check for form controls in server pages that need Prisma to render.
 * A control passes with aria-label, aria-labelledby, type="hidden", or an id that a
 * Label/label htmlFor in the same file points at.
 */
export function findUnlabeledInSource(source: string): string[] {
  const problems: string[] = [];
  const htmlFor = new Set([...source.matchAll(/htmlFor=["{]`?([\w-]+)/g)].map((m) => m[1]));

  for (const match of source.matchAll(FORM_CONTROL)) {
    const tag = match[0];
    if (/\{\.\.\.props\}/.test(tag)) continue;
    if (/\btype="hidden"/.test(tag) || LABEL_ATTRS.test(tag)) continue;
    const id = tag.match(/\bid=["{]`?([\w-]+)/)?.[1];
    if (id && htmlFor.has(id)) continue;
    problems.push(tag.replace(/\s+/g, " "));
  }
  return problems;
}
