// AI Interview Assistant v4 — Background Service Worker
// Handles keyboard commands and sidePanel API

// Enable sidePanel on install
chrome.runtime.onInstalled.addListener(() => {
  // SidePanel is declared in manifest — no extra setup needed
  console.log('[AI Interview] v4.0 installed — sidePanel ready');
});

// ─── KEYBOARD SHORTCUT: Alt+Shift+M ────────────────────────────────────────────
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-listening') {
    // Get current tab and send toggle message to sidePanel (or content script)
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    // Try sending to sidePanel first
    try {
      const pages = await chrome.sidePanel.getAll({});
      // If sidePanel is open on this tab, it will handle the message
      chrome.runtime.sendMessage({ action: 'toggle-listening' });
    } catch (e) {
      // Fallback: send to content script
      chrome.tabs.sendMessage(tab.id, { action: 'toggle-listening' }).catch(() => {
        // No listener available — user should open sidePanel
        chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => {});
      });
    }
  }
});

// ─── STORAGE HELPERS ──────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'get-settings') {
    chrome.storage.sync.get(['apiKey', 'model', 'recognitionLang', 'ttsSpeed'], (data) => {
      sendResponse(data);
    });
    return true; // async response
  }

  if (message.type === 'save-history') {
    chrome.storage.sync.get(['answerHistory'], (prev) => {
      const history = prev.answerHistory || [];
      history.unshift(message.entry);
      if (history.length > 50) history.pop();
      chrome.storage.sync.set({ answerHistory: history });
    });
  }

  if (message.action === 'open-sidepanel') {
    chrome.sidePanel.open({ tabId: sender.tab?.id }).catch(() => {});
  }
});

// Auto-open sidePanel when user clicks "開啟面試模式" from popup
// (popup sends message to background → background opens sidePanel)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.openSidePanel) {
    chrome.sidePanel.open({ tabId: msg.tabId }).catch(() => {});
  }
});
