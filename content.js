function getSelectedText() {
  return window.getSelection().toString().trim();
}

function getFocusedFieldText() {
  const el = document.activeElement;
  if (!el) return '';
  if (el.tagName === 'TEXTAREA') return el.value.trim();
  if (el.tagName === 'INPUT' && el.type === 'text') return el.value.trim();
  if (el.isContentEditable) return el.innerText.trim();
  return '';
}

function extractPromptText() {
  return getSelectedText() || getFocusedFieldText() || null;
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'TRIGGER_HONE') {
    const text = extractPromptText();
    if (!text) {
      console.log('[Hone] no text found');
      return;
    }
    chrome.runtime.sendMessage({ type: 'ANALYSE_PROMPT', text }, (response) => {
      console.log('[Hone] analysis response:', response);
    });
  }
});
