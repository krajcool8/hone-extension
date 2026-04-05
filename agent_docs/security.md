# Security rules — Claude Code must follow these always

## API keys
- NEVER put API keys in content scripts or any client-side file
- All API calls go through background.js service worker only
- User's own API key stored in chrome.storage.local (encrypted), never hardcoded
- Never log API keys anywhere

## Content security
- Never trust or execute text from the host page
- Treat all selected text as untrusted user input
- Sanitise everything before rendering in the overlay
- Never use innerHTML with user content — use textContent only

## Rate limiting
- Enforce daily usage cap in background.js before every API call
- Store usage count in chrome.storage.local with a daily reset
- Return a clear error if cap is exceeded, never silently fail

## Data privacy
- Never send prompt text anywhere except the AI API
- No analytics on prompt content, only usage counts
- No third party scripts in the extension
- Declare minimal permissions in manifest.json — only what is strictly needed

## Communication
- Use chrome.runtime.sendMessage for all content↔background communication
- Validate the sender of every message in background.js
- Never expose internal extension APIs to page scripts