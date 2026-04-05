# AI integration rules

## Model
- Always use claude-sonnet-4-6
- Max tokens: 1024 for analysis responses — never more
- Temperature: 0.3 — we want consistent, deterministic scoring

## API calls
- All calls made from background.js service worker only
- Never call the API from content.js or overlay.js
- Always check usage cap before making a call — refuse if exceeded

## Rate limiting
- Store daily usage count in chrome.storage.local
- Reset count at midnight using a timestamp check
- Free tier cap: 10 analyses per day
- Return a clear error object if cap exceeded — never silently fail

## Prompt structure
- System prompt defines the scoring rubric and output format
- User message contains only the prompt text to be analysed
- Response must always be valid JSON — enforce this in the system prompt
- Always validate JSON before passing to the UI — catch parse errors

## Response format
Always request this exact JSON shape:
{
  "score": 74,
  "dimensions": {
    "clarity": { "score": 20, "max": 25, "feedback": "..." },
    "specificity": { "score": 18, "max": 25, "feedback": "..." },
    "directness": { "score": 14, "max": 20, "feedback": "..." },
    "conciseness": { "score": 14, "max": 20, "feedback": "..." },
    "context_quality": { "score": 8, "max": 10, "feedback": "..." }
  },
  "suggestions": [
    {
      "dimension": "clarity",
      "type": "remove" | "reword" | "add",
      "issue": "short description of the problem",
      "reason": "why this hurts the prompt"
    }
  ]
}

## Error handling
- Wrap every API call in try/catch
- On failure show a non-blocking error in the overlay
- Never crash the host page on API failure
- Log errors to chrome.storage.local for debugging, never to console in prod