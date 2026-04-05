const SYSTEM_PROMPT = `You are a prompt quality analyzer. Analyze the given prompt across these 5 dimensions:

1. Clarity (0-20): How clear and unambiguous is the prompt?
2. Specificity (0-20): How specific and detailed is the request?
3. Context (0-20): How much relevant context is provided?
4. Structure (0-20): How well-organized and formatted is the prompt?
5. Goal (0-20): How clearly is the desired outcome stated?

Respond with ONLY valid JSON in exactly this shape, no markdown fences:
{
  "score": <total 0-100>,
  "dimensions": [
    { "name": "Clarity", "score": <0-20>, "feedback": "<one sentence>" },
    { "name": "Specificity", "score": <0-20>, "feedback": "<one sentence>" },
    { "name": "Context", "score": <0-20>, "feedback": "<one sentence>" },
    { "name": "Structure", "score": <0-20>, "feedback": "<one sentence>" },
    { "name": "Goal", "score": <0-20>, "feedback": "<one sentence>" }
  ],
  "suggestions": [
    { "dimension": "<name>", "type": "add|remove|rephrase", "issue": "<what's wrong>", "reason": "<why it matters>", "improved": "<rewritten text>" }
  ]
}`;

async function getApiKey() {
  const { apiKey } = await chrome.storage.local.get('apiKey');
  if (!apiKey) throw { errorType: 'NO_KEY' };
  return apiKey;
}

async function checkAndIncrementUsage() {
  const today = new Date().toISOString().slice(0, 10);
  const { usageDate, usageCount = 0 } = await chrome.storage.local.get(['usageDate', 'usageCount']);
  if (usageDate !== today) {
    await chrome.storage.local.set({ usageDate: today, usageCount: 1 });
    return;
  }
  if (usageCount >= 10) throw { errorType: 'CAP_REACHED' };
  await chrome.storage.local.set({ usageCount: usageCount + 1 });
}

async function callClaudeApi({ apiKey, promptText }) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      temperature: 0.3,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: promptText }],
    }),
  });

  if (response.status === 401) throw { errorType: 'AUTH_ERROR' };
  if (!response.ok) throw { errorType: 'NETWORK_ERROR' };

  return response.json();
}

function parseClaudeResponse(body) {
  try {
    let text = body.content[0].text.trim();
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    const result = JSON.parse(text);
    if (typeof result.score !== 'number' || !Array.isArray(result.dimensions)) {
      throw new Error('bad shape');
    }
    return result;
  } catch {
    throw { errorType: 'PARSE_ERROR' };
  }
}

async function handleAnalysis(promptText) {
  try {
    const apiKey = await getApiKey();
    await checkAndIncrementUsage();
    const body = await callClaudeApi({ apiKey, promptText });
    const result = parseClaudeResponse(body);
    return { ok: true, result };
  } catch (err) {
    return { ok: false, errorType: err.errorType || 'NETWORK_ERROR' };
  }
}

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'trigger-hone') return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  chrome.tabs.sendMessage(tab.id, { type: 'TRIGGER_HONE' }, () => {
    void chrome.runtime.lastError;
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'ANALYSE_PROMPT') {
    handleAnalysis(message.text).then(sendResponse);
    return true;
  }
});
