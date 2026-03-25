// AI Interview Assistant - Background Service Worker
// Handles keyboard shortcuts and context menu

// Create context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'aiInterviewAssistant',
    title: '🤖 AI 面試助手',
    contexts: ['page', 'selection']
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'aiInterviewAssistant') {
    chrome.tabs.sendMessage(tab.id, { action: 'showQuickAnswer' });
  }
});

// Keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (command === 'toggle-listening') {
    const settings = await chrome.storage.local.get(['isListening']);
    if (settings.isListening) {
      chrome.tabs.sendMessage(tab.id, { action: 'stopListening' });
    } else {
      chrome.tabs.sendMessage(tab.id, { action: 'startListening' });
    }
  } else if (command === 'get-answer') {
    chrome.tabs.sendMessage(tab.id, { action: 'getQuickAnswer' });
  }
});

// Handle messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'speech-to-text') {
    // Handle speech recognition results
    console.log('Speech recognized:', message.text);
  }
});
