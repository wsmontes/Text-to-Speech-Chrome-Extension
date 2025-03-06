'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // UI Elements
  const autoSpeechCheckbox = document.getElementById('tts-auto-speech');
  const autoDetectCheckbox = document.getElementById('tts-auto-detect');
  const forcedLanguageSelect = document.getElementById('tts-forced-lang');
  const triggerHoverRadio = document.getElementById('tts-trigger-hover');
  const triggerSelectionRadio = document.getElementById('tts-trigger-selection');
  const highlightStyleSelect = document.getElementById('tts-highlight-style');
  const customColorContainer = document.getElementById('custom-color-container');
  const customColorInput = document.getElementById('tts-custom-color');
  const voiceRateSlider = document.getElementById('tts-voice-rate');
  const rateDisplay = document.getElementById('rate-display');
  const voicePitchSlider = document.getElementById('tts-voice-pitch');
  const pitchDisplay = document.getElementById('pitch-display');
  const testSpeechBtn = document.getElementById('tts-test-speech');
  const refreshVoicesBtn = document.getElementById('tts-refresh-voices');
  const openSettingsBtn = document.getElementById('tts-open-settings');
  const browserLanguageSpan = document.getElementById('browser-language');
  const voiceCountSpan = document.getElementById('voice-count');
  const statusMessage = document.getElementById('status-message');
  
  // Load settings from storage
  function loadSettings() {
    chrome.storage.local.get([
      'autoSpeechEnabled', 
      'autoDetect', 
      'forcedLanguage', 
      'triggerMode', 
      'highlightStyle', 
      'customHighlightColor',
      'voiceRate',
      'voicePitch'
    ], (result) => {
      // Set defaults if not set
      autoSpeechCheckbox.checked = result.autoSpeechEnabled !== false;
      autoDetectCheckbox.checked = result.autoDetect !== false;
      forcedLanguageSelect.value = result.forcedLanguage || 'en-US';
      forcedLanguageSelect.disabled = autoDetectCheckbox.checked;
      
      if (result.triggerMode === 'selection') {
        triggerSelectionRadio.checked = true;
      } else {
        triggerHoverRadio.checked = true;
      }
      
      highlightStyleSelect.value = result.highlightStyle || 'default';
      customColorInput.value = convertRgbaToHex(result.customHighlightColor || 'rgba(255, 255, 0, 0.3)');
      customColorContainer.style.display = highlightStyleSelect.value === 'custom' ? 'block' : 'none';
      
      voiceRateSlider.value = result.voiceRate || 1.0;
      rateDisplay.textContent = `${voiceRateSlider.value}x`;
      
      voicePitchSlider.value = result.voicePitch || 1.0;
      pitchDisplay.textContent = `${voicePitchSlider.value}x`;
    });
    
    // Display browser language
    browserLanguageSpan.textContent = navigator.language || 'en-US';
    
    // Check available voices
    checkVoices();
  }
  
  // Event listeners for settings changes
  autoSpeechCheckbox.addEventListener('change', () => {
    chrome.storage.local.set({ autoSpeechEnabled: autoSpeechCheckbox.checked });
    showStatusMessage('Auto speech ' + (autoSpeechCheckbox.checked ? 'enabled' : 'disabled'));
  });
  
  autoDetectCheckbox.addEventListener('change', () => {
    forcedLanguageSelect.disabled = autoDetectCheckbox.checked;
    chrome.storage.local.set({ autoDetect: autoDetectCheckbox.checked });
    showStatusMessage('Auto language detection ' + (autoDetectCheckbox.checked ? 'enabled' : 'disabled'));
  });
  
  forcedLanguageSelect.addEventListener('change', () => {
    chrome.storage.local.set({ forcedLanguage: forcedLanguageSelect.value });
    showStatusMessage(`Forced language set to ${forcedLanguageSelect.options[forcedLanguageSelect.selectedIndex].text}`);
  });
  
  document.querySelectorAll('input[name="triggerMode"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const mode = document.querySelector('input[name="triggerMode"]:checked').value;
      chrome.storage.local.set({ triggerMode: mode });
      showStatusMessage(`Trigger mode set to ${mode}`);
    });
  });
  
  highlightStyleSelect.addEventListener('change', () => {
    customColorContainer.style.display = highlightStyleSelect.value === 'custom' ? 'block' : 'none';
    chrome.storage.local.set({ highlightStyle: highlightStyleSelect.value });
    showStatusMessage(`Highlight style set to ${highlightStyleSelect.value}`);
  });
  
  customColorInput.addEventListener('change', () => {
    const rgbaColor = convertHexToRgba(customColorInput.value);
    chrome.storage.local.set({ customHighlightColor: rgbaColor });
    showStatusMessage('Custom highlight color set');
  });
  
  voiceRateSlider.addEventListener('input', () => {
    rateDisplay.textContent = `${voiceRateSlider.value}x`;
  });
  
  voiceRateSlider.addEventListener('change', () => {
    chrome.storage.local.set({ voiceRate: parseFloat(voiceRateSlider.value) });
    showStatusMessage(`Voice rate set to ${voiceRateSlider.value}x`);
  });
  
  voicePitchSlider.addEventListener('input', () => {
    pitchDisplay.textContent = `${voicePitchSlider.value}x`;
  });
  
  voicePitchSlider.addEventListener('change', () => {
    chrome.storage.local.set({ voicePitch: parseFloat(voicePitchSlider.value) });
    showStatusMessage(`Voice pitch set to ${voicePitchSlider.value}x`);
  });
  
  // Action buttons
  testSpeechBtn.addEventListener('click', () => {
    // Communicate with active tab to test speech
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "test-speech" });
        window.close();
      }
    });
  });
  
  refreshVoicesBtn.addEventListener('click', () => {
    // Communicate with active tab to refresh voices
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "refresh-voices" });
        checkVoices();
        showStatusMessage('Refreshing speech voices');
      }
    });
  });
  
  openSettingsBtn.addEventListener('click', () => {
    // Open in-page settings overlay
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "toggle-popup" });
        window.close();
      }
    });
  });
  
  // Utility functions
  function showStatusMessage(message) {
    statusMessage.textContent = message;
    statusMessage.style.display = 'block';
    setTimeout(() => {
      statusMessage.style.display = 'none';
    }, 2000);
  }
  
  function checkVoices() {
    if ('speechSynthesis' in window) {
      const voices = window.speechSynthesis.getVoices();
      voiceCountSpan.textContent = voices.length > 0 ? voices.length : 'Loading...';
      
      if (voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          const updatedVoices = window.speechSynthesis.getVoices();
          voiceCountSpan.textContent = updatedVoices.length;
        };
      }
    } else {
      voiceCountSpan.textContent = 'Not available';
    }
  }
  
  function convertRgbaToHex(rgba) {
    // Extract rgba values with regex
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (!match) return '#ffff00'; // Default yellow if not matching
    
    // Convert to hex
    const r = parseInt(match[1]).toString(16).padStart(2, '0');
    const g = parseInt(match[2]).toString(16).padStart(2, '0');
    const b = parseInt(match[3]).toString(16).padStart(2, '0');
    
    return `#${r}${g}${b}`;
  }
  
  function convertHexToRgba(hex, alpha = 0.3) {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse the hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Return rgba string
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  
  // Initialize
  loadSettings();
});
