const apiKeyInput = document.getElementById('api-key-input');
const saveBtn = document.getElementById('save-btn');
const statusMsg = document.getElementById('status-msg');

function loadSavedKey() {
  chrome.storage.local.get('apiKey', ({ apiKey }) => {
    if (apiKey) {
      apiKeyInput.value = apiKey;
    }
  });
}

function saveKey(key) {
  if (!key) {
    statusMsg.textContent = 'Please enter an API key.';
    return;
  }
  if (!key.startsWith('sk-ant-')) {
    statusMsg.textContent = 'Key should start with sk-ant-';
    return;
  }
  chrome.storage.local.set({ apiKey: key }, () => {
    statusMsg.textContent = 'Saved.';
  });
}

saveBtn.addEventListener('click', () => {
  statusMsg.textContent = '';
  saveKey(apiKeyInput.value.trim());
});

document.addEventListener('DOMContentLoaded', loadSavedKey);
