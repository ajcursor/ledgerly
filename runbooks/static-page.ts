import { stripOptionalTags } from "@/runbooks/optional-tag";
import { RUNBOOK_TRACKS, trackOptionalFeatures } from "@/runbooks/tracks";
import type { DemoBeat, DemoSection } from "@/runbooks/types";

export const STATIC_RUNBOOKS_PATH = "runbooks.html";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function visibleText(value: string | undefined): string {
  if (!value) return "";
  return stripOptionalTags(value).text;
}

/** Feature carried on the beat, or parsed from a leftover `[Optional - Feature]` tag. */
export function beatFeature(beat: DemoBeat): string | undefined {
  if (beat.optional?.feature) return beat.optional.feature;
  const chunks = [beat.say, beat.detail, beat.example, beat.title];
  for (const part of beat.after ?? []) chunks.push(part.text);
  for (const chunk of chunks) {
    if (!chunk) continue;
    const found = stripOptionalTags(chunk).features;
    if (found[0]) return found[0];
  }
  return undefined;
}

function featureDomId(trackId: string, feature: string): string {
  const slug = feature
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `feature-${trackId}-${slug}`;
}

export function renderBeatHtml(beat: DemoBeat): string {
  return renderBeat(beat);
}

type CardBlock =
  | { kind: "say"; text: string }
  | { kind: "steps"; lines: string[] }
  | { kind: "prompt"; text: string; label: string };

function doLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => visibleText(line))
    .filter((line) => line.length > 0);
}

function cardBlocks(beat: DemoBeat): CardBlock[] {
  const blocks: CardBlock[] = [];
  const say = visibleText(beat.say);
  if (say) blocks.push({ kind: "say", text: say });
  const leading = doLines(beat.detail);
  if (leading.length) blocks.push({ kind: "steps", lines: leading });
  const example = visibleText(beat.example);
  if (example) {
    blocks.push({
      kind: "prompt",
      text: example,
      label: beat.pasteLabel ?? "Paste in Grok Build",
    });
  }
  for (const part of beat.after ?? []) {
    const text = visibleText(part.text);
    if (!text) continue;
    if (part.kind === "do") {
      const last = blocks[blocks.length - 1];
      if (last?.kind === "steps") last.lines.push(text);
      else blocks.push({ kind: "steps", lines: [text] });
      continue;
    }
    blocks.push({
      kind: "prompt",
      text,
      label: part.pasteLabel ?? "Paste in Grok Build",
    });
  }
  return blocks;
}

function renderDo(lines: string[]): string {
  const tag = lines.length > 1 ? "ol" : "ul";
  const items = lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("");
  return `
          <div class="do-box">
            <${tag}>${items}</${tag}>
          </div>`;
}

function renderPrompt(text: string, label: string): string {
  return `
          <div class="paste">
            <div class="paste-head">
              <span>${escapeHtml(label)}</span>
              <button type="button" class="copy">Copy</button>
            </div>
            <pre>${escapeHtml(text)}</pre>
          </div>`;
}

function renderBlock(block: CardBlock): string {
  if (block.kind === "say") return `\n          <p class="say">${escapeHtml(block.text)}</p>`;
  if (block.kind === "steps") return renderDo(block.lines);
  return renderPrompt(block.text, block.label);
}

function renderBeat(beat: DemoBeat): string {
  const feature = beatFeature(beat);
  const featureAttr = feature ? ` data-feature="${escapeHtml(feature)}"` : "";
  return `
        <article class="beat" data-beat="${escapeHtml(beat.id)}"${featureAttr}>
          <h4>${escapeHtml(beat.title)}</h4>${cardBlocks(beat).map(renderBlock).join("")}
        </article>`;
}

function renderSection(trackId: string, section: DemoSection): string {
  return `
      <section id="${trackId}-${section.id}">
        <h3>${escapeHtml(section.title)}</h3>
        <div class="beats">${section.beats.map(renderBeat).join("")}
        </div>
      </section>`;
}

function renderFeatureChecklist(track: (typeof RUNBOOK_TRACKS)[number]): string {
  const features = trackOptionalFeatures(track);
  if (features.length === 0) return "";
  const boxes = features
    .map((feature) => {
      const id = featureDomId(track.id, feature);
      return `
        <label class="feature-option" for="${id}">
          <input id="${id}" class="feature-toggle" type="checkbox" data-track="${escapeHtml(track.id)}" data-feature="${escapeHtml(feature)}" checked>
          ${escapeHtml(feature)}
        </label>`;
    })
    .join("");
  return `
      <fieldset class="feature-checklist">
        <legend>Optional features</legend>${boxes}
      </fieldset>`;
}

function renderFeatureCss(): string {
  return RUNBOOK_TRACKS.flatMap((track) =>
    trackOptionalFeatures(track).map((feature) => {
      const name = escapeHtml(feature);
      return `.track[data-track="${track.id}"]:has(.feature-toggle[data-feature="${name}"]:not(:checked)) .beat[data-feature="${name}"] { display: none; }`;
    }),
  ).join("\n    ");
}

function renderTrack(track: (typeof RUNBOOK_TRACKS)[number]): string {
  const tabs = track.sections
    .map((section) => `<a href="#${track.id}-${section.id}">${escapeHtml(section.title)}</a>`)
    .join("\n        ");
  return `
    <div class="track" data-track="${track.id}">
      <h2>${escapeHtml(track.title)}</h2>
      <p class="lede">${escapeHtml(track.description)}</p>${renderFeatureChecklist(track)}
      <nav class="tabs" aria-label="${track.id} sections">
        ${tabs}
      </nav>${track.sections.map((section) => renderSection(track.id, section)).join("")}
    </div>`;
}

/**
 * Self-contained runbooks page: no app server, no network, no build step.
 * Every track is pre-rendered so the file still reads top to bottom with
 * scripts disabled; the script only hides tracks other than `?track=`.
 * Optional beats stay in the markup. Each track lists its optional features
 * as checkboxes, checked by default. Unchecking a feature hides its beats.
 * The choice is stored in localStorage. Required beats are always shown.
 */
export function renderRunbooksHtml(): string {
  const options = RUNBOOK_TRACKS.map(
    (track) => `<option value="${track.id}">${escapeHtml(track.title)}</option>`,
  ).join("\n          ");

  return `<!doctype html>
<!-- Generated from runbooks/meta.ts by \`npm run runbooks:export\`. Do not edit by hand. -->
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Ledgerly runbooks</title>
  <style>
    :root {
      --indigo: #4f46e5;
      --ink: #111827;
      --ink-soft: #6b7280;
      --paper: #f7f7fb;
      --paper-elevated: #ffffff;
      --line: #e5e7eb;
      --indigo-soft: #eef2ff;
      --muted: #f3f4f6;
      --success: #059669;
      --radius: 0.625rem;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--paper);
      color: var(--ink);
      font: 14px/1.5 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    }
    main { max-width: 1200px; margin: 0 auto; padding: 2rem 1.5rem 4rem; }
    .eyebrow { margin: 0; color: var(--indigo); font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
    h1 { margin: 0.25rem 0 0.25rem; font-size: 1.5rem; }
    .lede { margin: 0.25rem 0 0; max-width: 48rem; color: var(--ink-soft); font-size: 0.8125rem; }
    label { display: block; margin: 1.5rem 0 0.375rem; font-size: 0.75rem; font-weight: 500; }
    select {
      height: 2.25rem; min-width: 12rem; padding: 0 0.75rem;
      border: 1px solid var(--line); border-radius: var(--radius);
      background: var(--paper-elevated); color: var(--ink); font: inherit;
    }
    h2 { margin: 1.5rem 0 0; font-size: 1.25rem; }
    .tabs { display: flex; gap: 0.5rem; overflow-x: auto; margin: 1rem 0 0.5rem; padding-bottom: 0.25rem; }
    .tabs a {
      flex-shrink: 0; padding: 0.375rem 0.75rem;
      border: 1px solid var(--line); border-radius: var(--radius);
      background: var(--paper-elevated); color: var(--ink); text-decoration: none; font-size: 0.8125rem;
    }
    .tabs a:hover { border-color: var(--indigo); color: var(--indigo); }
    section { margin-top: 2.5rem; scroll-margin-top: 1rem; }
    h3 { margin: 0 0 0.75rem; font-size: 1.125rem; }
    .beats { display: grid; gap: 0.75rem; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); }
    .beat {
      display: flex; flex-direction: column; gap: 0.75rem; padding: 1rem;
      border: 1px solid var(--line); border-radius: var(--radius); background: var(--paper-elevated);
    }
    h4 { margin: 0; font-size: 0.875rem; }
    .say { margin: 0; color: var(--ink-soft); font-size: 0.75rem; white-space: pre-line; }
    .do-box, pre {
      margin: 0; padding: 0.75rem; overflow: auto;
      border: 1px solid var(--line); border-radius: var(--radius);
    }
    .do-box {
      background: var(--indigo-soft); color: var(--ink);
      font: 0.75rem/1.6 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    }
    .do-box ol, .do-box ul { margin: 0; padding-left: 1.25rem; }
    .do-box li + li { margin-top: 0.25rem; }
    .paste { margin-top: auto; }
    .paste-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.75rem; font-weight: 500; }
    .copy {
      padding: 0.25rem 0.625rem; border: 1px solid var(--line); border-radius: var(--radius);
      background: var(--paper-elevated); color: var(--ink); font: inherit; cursor: pointer;
    }
    .copy.done { color: var(--success); border-color: var(--success); }
    pre {
      white-space: pre-wrap; background: var(--muted);
      font: 0.75rem/1.6 ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    .track[hidden] { display: none; }
    .feature-checklist {
      display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center;
      margin: 1rem 0 0; padding: 0; border: 0;
    }
    .feature-checklist legend {
      padding: 0; margin: 0 0.25rem 0 0;
      font-size: 0.75rem; font-weight: 500; color: var(--ink);
    }
    .tabs a, label.feature-option {
      flex-shrink: 0; display: flex; align-items: center; gap: 0.5rem;
      margin: 0; padding: 0.375rem 0.75rem;
      border: 1px solid var(--line); border-radius: var(--radius);
      background: var(--paper-elevated); color: var(--ink);
      font-size: 0.8125rem; font-weight: 400; text-decoration: none; cursor: pointer;
    }
    .feature-option input { width: 1rem; height: 1rem; margin: 0; accent-color: var(--indigo); }
    ${renderFeatureCss()}
  </style>
</head>
<body>
  <main>
    <p class="eyebrow">Demo catalog</p>
    <h1>Runbooks</h1>
    <p class="lede">Choose a track, jump to a section, and copy the next beat into Grok Build. Link a track directly with <code>?track=201</code> or <code>?track=301</code>.</p>
    <label for="track">Catalog</label>
    <select id="track">
          ${options}
    </select>
${RUNBOOK_TRACKS.map(renderTrack).join("\n")}
  </main>
  <script>
    (function () {
      var select = document.getElementById("track");
      var tracks = Array.prototype.slice.call(document.querySelectorAll(".track"));
      var ids = tracks.map(function (el) { return el.getAttribute("data-track"); });

      function show(id, updateUrl) {
        if (ids.indexOf(id) === -1) id = ids[0];
        select.value = id;
        tracks.forEach(function (el) { el.hidden = el.getAttribute("data-track") !== id; });
        document.title = "Runbooks · " + id;
        if (updateUrl) {
          try {
            var url = new URL(window.location.href);
            url.searchParams.set("track", id);
            url.hash = "";
            history.replaceState(null, "", url.toString());
          } catch (err) {
            // Canvas srcdoc pages cannot update their about:srcdoc URL.
          }
          if (window.parent !== window) {
            window.parent.postMessage({ type: "runbooks:track", track: id }, "*");
          }
        }
      }

      var params = new URLSearchParams(window.location.search);
      var fromHash = window.location.hash.slice(1).split("-")[0];
      show(params.get("track") || (ids.indexOf(fromHash) !== -1 ? fromHash : ids[0]), false);
      if (window.location.hash) {
        var target = document.getElementById(window.location.hash.slice(1));
        if (target) target.scrollIntoView();
      }
      select.addEventListener("change", function () { show(select.value, true); });
      window.addEventListener("message", function (event) {
        var data = event.data;
        if (
          event.source === window.parent &&
          data &&
          data.type === "runbooks:set-track" &&
          typeof data.track === "string" &&
          ids.indexOf(data.track) !== -1
        ) {
          show(data.track, false);
        }
      });

      var FEATURE_KEY = "ledgerly-runbooks-optional-features";
      function readFeatures() {
        try {
          var raw = localStorage.getItem(FEATURE_KEY);
          return raw ? JSON.parse(raw) : {};
        } catch (err) {
          return {};
        }
      }
      function writeFeatures(state) {
        try {
          localStorage.setItem(FEATURE_KEY, JSON.stringify(state));
        } catch (err) {
          // Private browsing can reject storage. The checkbox still toggles.
        }
      }
      var savedFeatures = readFeatures();
      Array.prototype.forEach.call(document.querySelectorAll(".feature-toggle"), function (box) {
        var trackId = box.getAttribute("data-track");
        var featureName = box.getAttribute("data-feature");
        var trackState = savedFeatures[trackId] || {};
        box.checked = trackState[featureName] !== false;
        box.addEventListener("change", function () {
          var state = readFeatures();
          if (!state[trackId]) state[trackId] = {};
          if (box.checked) delete state[trackId][featureName];
          else state[trackId][featureName] = false;
          writeFeatures(state);
        });
      });

      function fallbackCopy(text) {
        var area = document.createElement("textarea");
        area.value = text;
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        var ok = document.execCommand("copy");
        document.body.removeChild(area);
        return ok ? Promise.resolve() : Promise.reject();
      }

      document.addEventListener("click", function (event) {
        var button = event.target.closest(".copy");
        if (!button) return;
        var text = button.closest(".paste").querySelector("pre").textContent;
        var write = navigator.clipboard && window.isSecureContext
          ? navigator.clipboard.writeText(text).catch(function () { return fallbackCopy(text); })
          : fallbackCopy(text);
        write.then(function () {
          button.textContent = "Copied";
          button.classList.add("done");
          setTimeout(function () { button.textContent = "Copy"; button.classList.remove("done"); }, 1600);
        }, function () {});
      });
    })();
  </script>
</body>
</html>
`;
}
