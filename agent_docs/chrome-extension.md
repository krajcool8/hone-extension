# Chrome extension rules

## Manifest V3 — strictly enforced
- Use service workers, never background pages
- All API calls happen in background.js only, never content scripts
- Declare only permissions that are strictly needed
- Use chrome.scripting to inject content scripts dynamically where possible

## Hotkey
- Registered via commands API in manifest.json
- Listener lives in background.js
- Sends a message to content.js to trigger the overlay

## Messaging
- All background ↔ content communication via chrome.runtime.sendMessage
- Always validate sender.id === chrome.runtime.id in background.js
- Never expose internal APIs to the host page

## Storage
- Use chrome.storage.local for user settings and usage counts
- Never use localStorage — it is scoped to the extension page, not reliable

## Common MV3 pitfalls to avoid
- Service workers are not persistent — never assume state survives between events
- chrome.tabs.executeScript is MV2 — use chrome.scripting.executeScript
- Cannot use eval() or inline scripts in extension pages
- Content scripts cannot directly call the Claude API