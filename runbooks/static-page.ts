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

/**
 * Panel titles, Do steps, and Grok Build commands are editable in the browser.
 * `data-edit` names the field inside its card: `title`, `step-N`, or `prompt-N`.
 * `data-default` keeps the shipped text so a reset can restore it.
 */
function editAttrs(field: string, value: string): string {
  return ` data-edit="${field}" data-default="${escapeHtml(value)}" contenteditable="true"`;
}

function renderDo(lines: string[], firstStep: number): string {
  const tag = lines.length > 1 ? "ol" : "ul";
  const items = lines
    .map((line, index) => `<li${editAttrs(`step-${firstStep + index}`, line)}>${escapeHtml(line)}</li>`)
    .join("");
  return `
          <div class="do-box">
            <${tag}>${items}</${tag}>
          </div>`;
}

function renderPrompt(text: string, label: string, index: number): string {
  return `
          <div class="paste">
            <div class="paste-head">
              <span>${escapeHtml(label)}</span>
              <button type="button" class="copy">Copy</button>
            </div>
            <pre${editAttrs(`prompt-${index}`, text)}>${escapeHtml(text)}</pre>
          </div>`;
}

function renderBlock(block: CardBlock, counts: { step: number; prompt: number }): string {
  if (block.kind === "say") return `\n          <p class="say">${escapeHtml(block.text)}</p>`;
  if (block.kind === "steps") {
    const firstStep = counts.step;
    counts.step += block.lines.length;
    return renderDo(block.lines, firstStep);
  }
  const index = counts.prompt;
  counts.prompt += 1;
  return renderPrompt(block.text, block.label, index);
}

function renderBeat(beat: DemoBeat): string {
  const feature = beatFeature(beat);
  const featureAttr = feature ? ` data-feature="${escapeHtml(feature)}"` : "";
  const counts = { step: 0, prompt: 0 };
  return `
        <article class="beat" data-beat="${escapeHtml(beat.id)}"${featureAttr}>
          <h4${editAttrs("title", beat.title)}>${escapeHtml(beat.title)}</h4>${cardBlocks(beat)
            .map((block) => renderBlock(block, counts))
            .join("")}
          <button type="button" class="reset-beat" hidden>Reset this card</button>
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

function renderEditBar(): string {
  return `
      <div class="edit-bar">
        <span>Click a panel title, instruction, or Grok Build command to edit it. Edits save to <code>runbooks/edits.json</code> when the dev server is running.</span>
        <button type="button" class="reset-track" hidden>Reset edits in this track</button>
      </div>`;
}

function renderTrack(track: (typeof RUNBOOK_TRACKS)[number]): string {
  const tabs = track.sections
    .map((section) => `<a href="#${track.id}-${section.id}">${escapeHtml(section.title)}</a>`)
    .join("\n        ");
  return `
    <div class="track" data-track="${track.id}">
      <h2>${escapeHtml(track.title)}</h2>
      <p class="lede">${escapeHtml(track.description)}</p>${renderFeatureChecklist(track)}${renderEditBar()}
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
 * Panel titles, Do steps, and Grok Build commands are editable in place. Edits
 * are saved to runbooks/edits.json through app/api/runbook-edits when the dev
 * server at localhost:43173 is reachable, and cached in localStorage under
 * `ledgerly-runbooks-edits`. The page loads edits at runtime, so this HTML stays
 * deterministic. Each card or track can be reset to the shipped text.
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
    .save-status { margin: 0.5rem 0 0; color: var(--ink-soft); font-size: 0.75rem; }
    .save-status[data-state="server"] { color: var(--ink); }
    [data-edit] { border-radius: 0.25rem; cursor: text; }
    [data-edit]:hover { outline: 1px dashed var(--line); outline-offset: 3px; }
    [data-edit]:focus { outline: 2px solid var(--indigo); outline-offset: 3px; }
    .reset-beat, .reset-track {
      padding: 0.25rem 0.625rem; border: 1px solid var(--line); border-radius: var(--radius);
      background: var(--paper-elevated); color: var(--ink); font: inherit; font-size: 0.75rem; cursor: pointer;
    }
    .reset-beat { align-self: flex-start; }
    .reset-beat[hidden], .reset-track[hidden] { display: none; }
    .edit-bar {
      display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem;
      margin: 0.75rem 0 0; color: var(--ink-soft); font-size: 0.75rem;
    }
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
    <p class="save-status" id="save-status" role="status" data-state="saving">Checking for saved edits…</p>
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
        var text = button.closest(".paste").querySelector("pre").innerText;
        var write = navigator.clipboard && window.isSecureContext
          ? navigator.clipboard.writeText(text).catch(function () { return fallbackCopy(text); })
          : fallbackCopy(text);
        write.then(function () {
          button.textContent = "Copied";
          button.classList.add("done");
          setTimeout(function () { button.textContent = "Copy"; button.classList.remove("done"); }, 1600);
        }, function () {});
      });

      var EDIT_KEY = "ledgerly-runbooks-edits";
      var PENDING_KEY = "ledgerly-runbooks-edits-pending";
      var EDIT_API = "http://localhost:43173/api/runbook-edits";
      var SERVER_TEXT = "Saved to runbooks/edits.json through the dev server.";
      var LOCAL_TEXT = "Saved in this browser only. Start the dev server on localhost:43173 to save to runbooks/edits.json.";
      var statusEl = document.getElementById("save-status");
      var pushTimer = null;
      var pushSeq = 0;
      function readEdits() {
        try {
          var raw = localStorage.getItem(EDIT_KEY);
          var parsed = raw ? JSON.parse(raw) : {};
          return parsed && typeof parsed === "object" ? parsed : {};
        } catch (err) {
          return {};
        }
      }
      function writeEdits(state) {
        try {
          localStorage.setItem(EDIT_KEY, JSON.stringify(state));
        } catch (err) {
          // Private browsing can reject storage. The server copy is still written.
        }
      }
      function setPending(flag) {
        try {
          if (flag) localStorage.setItem(PENDING_KEY, "1");
          else localStorage.removeItem(PENDING_KEY);
        } catch (err) {
          // Storage can be unavailable. The next save still goes to the server.
        }
      }
      function hasPending() {
        try {
          return localStorage.getItem(PENDING_KEY) === "1";
        } catch (err) {
          return false;
        }
      }
      function showStatus(state, text) {
        statusEl.setAttribute("data-state", state);
        statusEl.textContent = text;
      }
      function pushToServer(state) {
        var seq = ++pushSeq;
        return fetch(EDIT_API, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(state),
          cache: "no-store",
          keepalive: true
        }).then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          setPending(false);
          if (seq === pushSeq) showStatus("server", SERVER_TEXT);
        }).catch(function () {
          setPending(true);
          if (seq === pushSeq) showStatus("local", LOCAL_TEXT);
        });
      }
      // Saves to localStorage at once. The server write waits 400ms after the last
      // keystroke, or runs at once when the now flag is set (blur, reset, page hide).
      function saveEdits(state, now) {
        writeEdits(state);
        setPending(true);
        clearTimeout(pushTimer);
        showStatus("saving", "Saving…");
        pushTimer = setTimeout(function () {
          pushTimer = null;
          pushToServer(state);
        }, now ? 0 : 400);
      }
      window.addEventListener("pagehide", function () {
        if (!pushTimer) return;
        clearTimeout(pushTimer);
        pushTimer = null;
        pushToServer(readEdits());
      });
      function trimmed(value) {
        return String(value || "").replace(/^\\s+|\\s+$/g, "");
      }
      function fieldText(el) {
        return trimmed(el.innerText);
      }
      function beatKey(article) {
        return article.closest(".track").getAttribute("data-track") + ":" + article.getAttribute("data-beat");
      }
      function isEdited(el) {
        return fieldText(el) !== trimmed(el.getAttribute("data-default"));
      }
      function refreshBeat(article) {
        var edited = Array.prototype.some.call(article.querySelectorAll("[data-edit]"), isEdited);
        article.classList.toggle("is-edited", edited);
        var reset = article.querySelector(".reset-beat");
        if (reset) reset.hidden = !edited;
        var track = article.closest(".track");
        var trackReset = track.querySelector(".reset-track");
        if (trackReset) trackReset.hidden = !track.querySelector(".beat.is-edited");
      }
      function saveField(el, leaving) {
        var article = el.closest(".beat");
        var field = el.getAttribute("data-edit");
        var fallback = trimmed(el.getAttribute("data-default"));
        var value = fieldText(el);
        if (leaving && value === "") {
          el.textContent = fallback;
          value = fallback;
        }
        var state = readEdits();
        var key = beatKey(article);
        var entry = state[key] || {};
        if (value === "" || value === fallback) delete entry[field];
        else entry[field] = value;
        if (Object.keys(entry).length) state[key] = entry;
        else delete state[key];
        saveEdits(state, leaving);
        refreshBeat(article);
      }
      function editableFrom(target) {
        return target && target.closest ? target.closest("[data-edit]") : null;
      }

      function applyEdits(state) {
        Array.prototype.forEach.call(document.querySelectorAll(".beat"), function (article) {
          var saved = state[beatKey(article)] || {};
          Array.prototype.forEach.call(article.querySelectorAll("[data-edit]"), function (el) {
            var field = el.getAttribute("data-edit");
            if (typeof saved[field] === "string" && saved[field] !== "") el.textContent = saved[field];
          });
          refreshBeat(article);
        });
      }
      // The server copy wins when reachable. Local edits that never reached the server
      // (pending flag, or an empty server file with local edits) are pushed up instead.
      // If the server cannot be reached, the browser cache is shown.
      function loadEdits() {
        var local = readEdits();
        showStatus("saving", "Checking for saved edits…");
        fetch(EDIT_API, { cache: "no-store" }).then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          return res.json();
        }).then(function (server) {
          if (!server || typeof server !== "object" || Array.isArray(server)) throw new Error("bad edits");
          var localCount = Object.keys(local).length;
          if (hasPending() || (Object.keys(server).length === 0 && localCount > 0)) {
            applyEdits(local);
            saveEdits(local, true);
            return;
          }
          writeEdits(server);
          applyEdits(server);
          showStatus("server", SERVER_TEXT);
        }).catch(function () {
          applyEdits(local);
          showStatus("local", LOCAL_TEXT);
        });
      }
      loadEdits();

      document.addEventListener("input", function (event) {
        var el = editableFrom(event.target);
        if (el) saveField(el, false);
      });
      document.addEventListener("focusout", function (event) {
        var el = editableFrom(event.target);
        if (el) saveField(el, true);
      });
      document.addEventListener("keydown", function (event) {
        var el = editableFrom(event.target);
        if (el && event.key === "Enter" && el.tagName !== "PRE") {
          event.preventDefault();
          el.blur();
        }
      });
      document.addEventListener("paste", function (event) {
        var el = editableFrom(event.target);
        if (!el) return;
        event.preventDefault();
        var text = (event.clipboardData || window.clipboardData).getData("text/plain");
        if (el.tagName !== "PRE") text = text.replace(/\\s*[\\r\\n]+\\s*/g, " ");
        document.execCommand("insertText", false, text);
      });

      // One save covers every card reset here, so the server copy is cleared in one request.
      function resetArticles(articles) {
        var state = readEdits();
        Array.prototype.forEach.call(articles, function (article) {
          delete state[beatKey(article)];
          Array.prototype.forEach.call(article.querySelectorAll("[data-edit]"), function (el) {
            el.textContent = el.getAttribute("data-default") || "";
          });
          refreshBeat(article);
        });
        saveEdits(state, true);
      }
      document.addEventListener("click", function (event) {
        var target = event.target;
        if (!target || !target.closest) return;
        var card = target.closest(".reset-beat");
        if (card) {
          resetArticles([card.closest(".beat")]);
          return;
        }
        var track = target.closest(".reset-track");
        if (track) resetArticles(track.closest(".track").querySelectorAll(".beat"));
      });
    })();
  </script>
</body>
</html>
`;
}
