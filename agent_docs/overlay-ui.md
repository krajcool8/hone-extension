# Overlay UI rules

## Behaviour
- Overlay appears anchored near the selected text or active textarea
- Must never cover the submit button of the AI platform
- Dismisses on Escape key or clicking outside
- Does not interfere with host page scroll, input, or layout
- Position recalculates if window is resized

## Injection
- Overlay HTML injected by content.js into a shadow DOM element
- Shadow DOM prevents host page CSS from bleeding in
- Never append directly to document.body without shadow root

## Rendering
- Never use innerHTML with user-supplied content — use textContent only
- Sanitise all strings before rendering
- Score animates from 0 to final value on load (300ms ease)
- Suggestions render as a list, each with a one-click apply button

## Style rules
- Self-contained CSS inside the shadow DOM
- No external fonts or CDN resources — bundle everything
- z-index: 2147483647 (max) to always appear on top
- Respect prefers-reduced-motion for animations

## States the overlay must handle
- Loading — spinner while API call is in progress
- Success — score + suggestions displayed
- Error — clear message, no score shown
- Cap reached — friendly message explaining the daily limit
- Empty — user triggered hotkey with no text selected