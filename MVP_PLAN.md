# Hone MVP — Ship Plan

## Phase 1 — Loadable shell

**Deliverable:** Extension loads in Chrome with no errors; Ctrl+Shift+H appears in chrome://extensions/shortcuts.

**Files:** `manifest.json` + stub `background.js` + stub `content.js`

Key manifest decisions:
- `permissions`: `["storage", "scripting", "activeTab"]`
- `host_permissions`: `["https://api.anthropic.com/*"]` only
- `background.service_worker`: `"background.js"`
- `content_scripts`: `[{ "matches": ["<all_urls>"], "js": ["content.js"] }]`
- `commands`: `"trigger-hone"` → Ctrl+Shift+H / Command+Shift+H
- `options_page`: `"options.html"`
- `web_accessible_resources`: overlay.html, overlay.css, overlay.js for all_urls

Stubs: both JS files need at least one line so Chrome doesn't error on missing service worker.

---

## Phase 2 — Options page (API key storage)

**Deliverable:** User pastes API key, saves, reloads — key persists.

**Files:** `options.html`, `options.js`

- `<input type="password">` for the key, no inline scripts (MV3 CSP)
- `loadSavedKey()` — reads `chrome.storage.local`, shows last 8 chars if present
- `saveKey(key)` — validates starts with `sk-ant-`, writes to `chrome.storage.local`
- Status message via `textContent` only, never `innerHTML`

---

## Phase 3 — Message pipeline

**Deliverable:** Hotkey causes a log in the content script console.

**Files:** `background.js` (command relay), `content.js` (listener)

`background.js` top-level:
```js
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'trigger-hone') return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  chrome.tabs.sendMessage(tab.id, { type: 'TRIGGER_HONE' });
});
```

`content.js` registers `chrome.runtime.onMessage` listener at module scope.

---

## Phase 4 — Text extraction

**Deliverable:** Hotkey logs extracted text from textarea or selection.

**Files:** `content.js`

Two strategies tried in order:
1. `getSelectedText()` → `window.getSelection().toString().trim()`
2. `getFocusedFieldText()` → `document.activeElement` checks `<textarea>`, `<input type="text">`, and `[contenteditable]` (covers ChatGPT, Claude.ai)
3. `extractPromptText()` → tries #1 then #2; returns `null` if both empty

---

## Phase 5 — API call and response parsing

**Deliverable:** Full round-trip: hotkey → text → background → Claude API → parsed JSON logged.

**Files:** `background.js` (full), `content.js` (send/receive)

`background.js` internal functions (each ≤20 lines):
- `getApiKey()` — reads storage, throws `{ errorType: 'NO_KEY' }` if missing
- `checkAndIncrementUsage()` — daily cap of 10, resets at midnight via date string comparison, throws `{ errorType: 'CAP_REACHED' }` if exceeded
- `callClaudeApi({ apiKey, promptText })` — fetch to `https://api.anthropic.com/v1/messages`, model `claude-sonnet-4-6`, max_tokens 1024, temperature 0.3, headers: `x-api-key` + `anthropic-version: '2023-06-01'`
- `parseClaudeResponse(body)` — `JSON.parse(content[0].text)`, validates shape, strips any markdown fences defensively
- `handleAnalysis(promptText)` — orchestrates above, always returns `{ ok: true, result }` or `{ ok: false, errorType }`

**Critical:** `return true` at end of `onMessage` listener (keeps channel open for async `sendResponse`).

**System prompt constant** in `background.js`:
- Defines all 5 dimensions with max scores
- Instructs Claude to return ONLY valid JSON matching the spec (no markdown fences)
- Specifies exact response shape (score, dimensions, suggestions)

**content.js** sends `{ type: 'ANALYSE_PROMPT', text }` and awaits response.

---

## Phase 6 — Overlay (shadow DOM, all 5 states)

**Deliverable:** Full UI renders correctly for all states; score animates; apply buttons work; dismiss works.

**Files:** `overlay.html`, `overlay.css`, `overlay.js`, edits to `content.js`

### 6a — Shadow DOM container + loading state

`content.js` additions:
- `createOverlayHost(anchorRect)` — appends `<div>` to `document.body`, attaches shadow root, fetches `overlay.html` via `fetch(chrome.runtime.getURL('overlay.html'))`, appends CSS link into shadow root
- Host div: `position: fixed`, `z-index: 2147483647`, anchored below selection/textarea rect
- Show loading state synchronously before the async fetch resolves (no blank flash)
- `removeOverlayHost()` — removes host from body

`overlay.html` structure (all IDs prefixed `hone-`):
- `#hone-overlay` → `#hone-header` (score label + close btn) + `#hone-body`
- `#hone-body` contains: `#hone-spinner`, `#hone-success` (score ring + dimensions + suggestions + apply-all), `#hone-error`

### 6b — Success state + interactions

`overlay.js` public API: `renderOverlay(state, data)` where state = `'loading' | 'success' | 'error' | 'cap_reached' | 'empty'`

Sub-functions:
- `animateScore(targetScore)` — RAF loop, count 0→target over 300ms ease, set via `textContent`
- `renderDimensions(dimensions)` — 5 divs with label, progress bar (width as inline style — correct use), feedback via `textContent`
- `renderSuggestions(suggestions)` — `<li>` per suggestion, dimension label + type badge + issue + reason (all `textContent`) + Apply button

**Apply button (MVP):** Copies improved text to clipboard and shows "Copied — paste to replace" toast. Avoids complexity of second API call and works across all contenteditable implementations.

Dismiss:
- Close button → `removeOverlayHost()`
- Escape key → `document.addEventListener('keydown', ...)`, removed on close
- Click outside → `document.addEventListener('click', ...)`, check if target is outside shadow host

---

## Phase 7 — All error paths wired

**Deliverable:** Every failure shows the correct overlay state; nothing fails silently.

| errorType | Overlay state | Message |
|---|---|---|
| `NO_KEY` | error | "Add your API key in Hone settings" |
| `CAP_REACHED` | cap_reached | "10/10 analyses used today. Resets at midnight." |
| `NETWORK_ERROR` | error | "Couldn't reach the API. Check your connection." |
| `AUTH_ERROR` | error | "API key rejected. Check your key in settings." |
| `PARSE_ERROR` | error | "Unexpected response from Claude. Try again." |
| null text | empty | "Select text or click into a prompt field first." |

Error messages defined as constants in `overlay.js`, not inline strings.

---

## Critical implementation risks

1. **`return true` in message listener** — must be at the end of the `onMessage` handler in `background.js` or async `sendResponse` fires on a closed channel.
2. **Listeners registered at top level** — both `onCommand` and `onMessage` must be top-level in `background.js`, never inside callbacks. Service workers are not persistent.
3. **Shadow DOM fetch timing** — show loading spinner synchronously before `overlay.html` fetch resolves to avoid blank flash.
4. **Positioning on chat platforms** — use `position: fixed` on `document.body` host element so it escapes ChatGPT's deeply nested stacking contexts. Test on ChatGPT and Claude.ai in Phase 6.
5. **Temperature parameter** — Anthropic API accepts `temperature` at the top level of the request body, not nested.

---

## Verification (end-to-end)

1. Load unpacked extension — no errors in chrome://extensions
2. Open options page, paste API key, reload — key persists
3. Go to ChatGPT, type a prompt, press Ctrl+Shift+H — overlay appears with score
4. Hover over suggestions — reason text visible
5. Click Apply on one suggestion — clipboard copy toast appears
6. Press Escape — overlay dismisses
7. Set usageCount to 10 in DevTools — cap_reached state appears
8. Use bad API key — auth error state appears
9. Press hotkey with nothing selected — empty state appears
