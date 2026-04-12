// AI Interview Assistant v4 — Content Script
// Handles messages from background.js and forwards to sidePanel
// Note: Microphone access is handled by sidePanel.js (not content script)

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'toggle-listening') {
    // Forward to sidePanel if available
    chrome.runtime.sendMessage({ action: 'toggle-listening' }).catch(() => {});
  } else if (message.action === 'startListening') {
    // Handled by sidePanel
    chrome.runtime.sendMessage({ action: 'toggle-listening' }).catch(() => {});
  } else if (message.action === 'stopListening') {
    chrome.runtime.sendMessage({ action: 'toggle-listening' }).catch(() => {});
  }
});

// No extra page interaction needed — sidePanel handles all UI/audio
console.log('[AI Interview] Content script ready — sidePanel handles the UI');
