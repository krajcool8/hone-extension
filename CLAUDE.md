# Hone

Chrome extension that coaches users to write better AI prompts.
Unlike competitors that silently rewrite, Hone explains *why* a prompt
is weak with inline suggestions and a visible score — like Grammarly
for AI prompts.

## Core user flow
1. User writes a prompt in any AI platform or selects any text
2. Triggers Hone via hotkey (Ctrl+Shift+H)
3. Overlay appears with a 0–100 score and labelled suggestions
4. User applies fixes individually or all at once
5. Score updates live to reflect the improved prompt

## Scoring — 5 dimensions summed to 100
- Clarity (25pts) — is the core ask unambiguous?
- Specificity (25pts) — format, length, tone, output type defined?
- Directness (20pts) — is the ask upfront or buried?
- Conciseness (20pts) — filler, hedging, redundant context?
- Context quality (10pts) — is background info relevant, not noise?

Suggestions must always be tied to a specific dimension and always
include the reason, not just the fix.

## Tech
- Manifest V3, vanilla HTML/CSS/JS
- Claude API (claude-sonnet-4-6) called from background service worker
- Never hardcode API keys — use Chrome storage API
- All AI calls go through background.js, never the content script


## Rules — always follow these

### Scope
- Only modify files relevant to the current task
- Never refactor, rename, or reformat code not mentioned in the task
- Never change CSS/styling unless explicitly asked
- Do not add dependencies without asking first
- One task at a time — complete it fully before moving on

### Code style
- No comments unless logic is genuinely non-obvious
- No console.log left in committed code
- Prefer simple and explicit over clever and abstract
- Keep functions small and single-purpose

### Communication
- If the task is ambiguous, ask before writing code
- If you hit a blocker, say so — don't silently work around it
- If you make an assumption, state it explicitly

### Docs
Read before writing any code:
- agent_docs/security.md — non-negotiable, always applies
- agent_docs/chrome-extension.md — before touching any extension files
- agent_docs/ai-integration.md — before any API calls
- agent_docs/overlay-ui.md — before any UI changes

## Workflow
- Break every task into the smallest possible subtasks before writing any code
- Do one subtask at a time — complete and verify before moving to the next
- Write tests before implementing a feature — get tests passing before moving on
- After each subtask report back with what was done and what is next
- Never make a decision about architecture, structure, or approach without asking first