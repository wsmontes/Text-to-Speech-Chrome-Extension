'use strict';

console.log("TTS Extension: Background script initialized");

// Create context menu items
chrome.runtime.onInstalled.addListener((details) => {
  // "Speak Selected Text" context menu item
  chrome.contextMenus.create({
    id: "speak-selection",
    title: "Speak Selected Text",
    contexts: ["selection"]
  });
  
  // "Show TTS Settings" context menu item for all contexts
  chrome.contextMenus.create({
    id: "settings",
    title: "TTS Settings",
    contexts: ["all"]
  });
  
  // "Run Speech Diagnostics" for troubleshooting
  chrome.contextMenus.create({
    id: "diagnostics",
    title: "Run Speech Diagnostics",
    contexts: ["all"]
  });
  
  // Setup default settings when installing
  chrome.storage.local.get(null, (result) => {
    // Only set defaults if settings don't exist yet
    if (Object.keys(result).length === 0) {
      chrome.storage.local.set({
        autoSpeechEnabled: true,
        autoDetect: true,
        forcedLanguage: 'en-US',
        highlightStyle: 'default',
        customHighlightColor: 'rgba(255, 255, 0, 0.3)',
        voiceRate: 1.0,
        voicePitch: 1.0,
        triggerMode: 'hover',
        siteSettings: {}  // Empty object for site-specific settings
      });
      console.log("TTS Extension: Default settings initialized");
    } else {
      console.log("TTS Extension: Existing settings found");
    }
  });
  
  // Force the extension icon to be visible
  if (details.reason === 'install') {
    try {
      chrome.action.setIcon({
        path: {
          "16": "icons/icon16.png",
          "48": "icons/icon48.png",
          "128": "icons/icon128.png"
        }
      });
      
      // Show a first-run notification to users
      chrome.tabs.create({
        url: 'welcome.html'
      });
    } catch (e) {
      console.error("TTS Extension: Could not set icon:", e);
    }
  }
});

// If you're using chrome.tts in the background script:
function speakInBackground(text, options = {}) {
  chrome.tts.speak(text, {
    rate: options.rate || 1,
    pitch: options.pitch || 1,
    voiceName: options.voiceName,
    onEvent: function(event) {
      if (event.type === 'error') {
        console.error('TTS Error:', event);
      }
    }
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "speak-selection") {
    chrome.tabs.sendMessage(tab.id, { action: "speak-selection" });
  }
  else if (info.menuItemId === "settings") {
    chrome.tabs.sendMessage(tab.id, { action: "toggle-popup" });
  }
  else if (info.menuItemId === "diagnostics") {
    injectDiagnosticsAndRun(tab.id);
  }
});

// Handle keyboard shortcut commands
chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "speak-selection") {
    chrome.tabs.sendMessage(tab.id, { action: "speak-selection" });
  }
  else if (command === "toggle-settings") {
    chrome.tabs.sendMessage(tab.id, { action: "toggle-popup" });
  }
});

// Function to inject and run the diagnostics script
function injectDiagnosticsAndRun(tabId) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ['diagnostics.js']
  }).then(() => {
    // After the script is loaded, run the diagnostics
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: () => {
        if (window.TTSDiagnostics) {
          window.TTSDiagnostics.runAll();
        } else {
          console.error("TTS Diagnostics not available");
        }
      }
    });
  }).catch(err => {
    console.error("Error injecting diagnostics script:", err);
  });
}