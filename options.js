'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // UI Elements
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // Settings elements - General
  const autoSpeechCheckbox = document.getElementById('auto-speech');
  const autoDetectCheckbox = document.getElementById('auto-detect');
  const forcedLanguageSelect = document.getElementById('forced-language');
  const triggerHoverRadio = document.getElementById('trigger-hover');
  const triggerSelectionRadio = document.getElementById('trigger-selection');
  const highlightStyleSelect = document.getElementById('highlight-style');
  const customColorContainer = document.getElementById('custom-color-container');
  const customColorInput = document.getElementById('custom-highlight-color');
  const saveGeneralBtn = document.getElementById('save-general');
  const generalStatusMsg = document.getElementById('general-status');
  
  // Settings elements - Sites
  const siteList = document.getElementById('site-list');
  const newSiteInput = document.getElementById('new-site');
  const addSiteBtn = document.getElementById('add-site');
  const sitesStatusMsg = document.getElementById('sites-status');
  
  // Settings elements - Voices
  const voiceRateSlider = document.getElementById('voice-rate');
  const rateDisplay = document.getElementById('rate-display');
  const voicePitchSlider = document.getElementById('voice-pitch');
  const pitchDisplay = document.getElementById('pitch-display');
  const availableVoicesSelect = document.getElementById('available-voices');
  const refreshVoicesBtn = document.getElementById('refresh-voices');
  const saveVoicesBtn = document.getElementById('save-voices');
  const voicesStatusMsg = document.getElementById('voices-status');
  
  // Settings elements - Troubleshooting
  const testTextInput = document.getElementById('test-text');
  const testSpeechBtn = document.getElementById('test-speech');
  const browserInfoSpan = document.getElementById('browser-info');
  const languageInfoSpan = document.getElementById('language-info');
  const voiceCountSpan = document.getElementById('voice-count');
  const resetSettingsBtn = document.getElementById('reset-settings');
  const troubleshootingStatusMsg = document.getElementById('troubleshooting-status');
  
  // Tab navigation
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      const tabId = tab.getAttribute('data-tab');
      tabContents.forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(tabId).classList.add('active');
    });
  });
  
  // General Settings
  function loadGeneralSettings() {
    chrome.storage.local.get([
      'autoSpeechEnabled', 
      'autoDetect', 
      'forcedLanguage', 
      'triggerMode', 
      'highlightStyle', 
      'customHighlightColor'
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
    });
  }
  
  saveGeneralBtn.addEventListener('click', () => {
    const settings = {
      autoSpeechEnabled: autoSpeechCheckbox.checked,
      autoDetect: autoDetectCheckbox.checked,
      forcedLanguage: forcedLanguageSelect.value,
      triggerMode: triggerHoverRadio.checked ? 'hover' : 'selection',
      highlightStyle: highlightStyleSelect.value,
      customHighlightColor: highlightStyleSelect.value === 'custom' ? 
        convertHexToRgba(customColorInput.value) : 
        'rgba(255, 255, 0, 0.3)'
    };
    
    chrome.storage.local.set(settings, () => {
      showStatusMessage(generalStatusMsg, 'Settings saved successfully!', 'success');
    });
  });
  
  autoDetectCheckbox.addEventListener('change', () => {
    forcedLanguageSelect.disabled = autoDetectCheckbox.checked;
  });
  
  highlightStyleSelect.addEventListener('change', () => {
    customColorContainer.style.display = highlightStyleSelect.value === 'custom' ? 'block' : 'none';
  });
  
  // Site Management
  function loadSiteSettings() {
    chrome.storage.local.get('siteSettings', (result) => {
      const siteSettings = result.siteSettings || {};
      
      if (Object.keys(siteSettings).length === 0) {
        siteList.innerHTML = `
          <div class="empty-state">
            <p>No site preferences added yet.</p>
            <p>Add a site below to customize its settings.</p>
          </div>
        `;
        return;
      }
      
      siteList.innerHTML = '';
      
      Object.keys(siteSettings).sort().forEach(site => {
        const isEnabled = siteSettings[site] !== false;
        
        const siteItem = document.createElement('div');
        siteItem.className = 'site-item';
        siteItem.innerHTML = `
          <span>${site}</span>
          <div class="site-controls">
            <span class="site-status ${isEnabled ? 'enabled' : 'disabled'}">
              ${isEnabled ? 'Enabled' : 'Disabled'}
            </span>
            <button class="toggle-site" data-site="${site}" data-enabled="${isEnabled}">
              ${isEnabled ? 'Disable' : 'Enable'}
            </button>
            <button class="remove-site danger" data-site="${site}">Remove</button>
          </div>
        `;
        
        siteList.appendChild(siteItem);
        
        // Add event listeners for site buttons
        siteItem.querySelector('.toggle-site').addEventListener('click', toggleSite);
        siteItem.querySelector('.remove-site').addEventListener('click', removeSite);
      });
    });
  }
  
  function toggleSite(event) {
    const site = event.target.getAttribute('data-site');
    const currentlyEnabled = event.target.getAttribute('data-enabled') === 'true';
    
    chrome.storage.local.get('siteSettings', (result) => {
      const siteSettings = result.siteSettings || {};
      siteSettings[site] = !currentlyEnabled;
      
      chrome.storage.local.set({ siteSettings }, () => {
        loadSiteSettings();
        showStatusMessage(sitesStatusMsg, `${site} is now ${!currentlyEnabled ? 'enabled' : 'disabled'}`, 'success');
      });
    });
  }
  
  function removeSite(event) {
    const site = event.target.getAttribute('data-site');
    
    chrome.storage.local.get('siteSettings', (result) => {
      const siteSettings = result.siteSettings || {};
      delete siteSettings[site];
      
      chrome.storage.local.set({ siteSettings }, () => {
        loadSiteSettings();
        showStatusMessage(sitesStatusMsg, `${site} removed from settings`, 'success');
      });
    });
  }
  
  addSiteBtn.addEventListener('click', () => {
    const newSite = newSiteInput.value.trim().toLowerCase();
    
    // Basic domain validation
    if (!newSite) {
      showStatusMessage(sitesStatusMsg, 'Please enter a valid domain', 'error');
      return;
    }
    
    // Strip http/https if entered
    let cleanDomain = newSite.replace(/^https?:\/\//, '');
    // Remove paths and trailing slashes
    cleanDomain = cleanDomain.split('/')[0];
    
    chrome.storage.local.get('siteSettings', (result) => {
      const siteSettings = result.siteSettings || {};
      
      // Check if already exists
      if (siteSettings.hasOwnProperty(cleanDomain)) {
        showStatusMessage(sitesStatusMsg, 'This site is already in the list', 'error');
        return;
      }
      
      // Add new site (enabled by default)
      siteSettings[cleanDomain] = true;
      
      chrome.storage.local.set({ siteSettings }, () => {
        newSiteInput.value = '';
        loadSiteSettings();
        showStatusMessage(sitesStatusMsg, `${cleanDomain} added successfully`, 'success');
      });
    });
  });
  
  // Voice Settings
  function loadVoiceSettings() {
    chrome.storage.local.get(['voiceRate', 'voicePitch'], (result) => {
      const rate = result.voiceRate || 1.0;
      const pitch = result.voicePitch || 1.0;
      
      voiceRateSlider.value = rate;
      rateDisplay.textContent = `${rate}x`;
      
      voicePitchSlider.value = pitch;
      pitchDisplay.textContent = `${pitch}x`;
    });
    
    loadAvailableVoices();
  }
  
  function loadAvailableVoices() {
    if ('speechSynthesis' in window) {
      let voices = speechSynthesis.getVoices();
      
      if (voices.length === 0) {
        // Wait for voices to load
        speechSynthesis.onvoiceschanged = () => {
          voices = speechSynthesis.getVoices();
          populateVoicesList(voices);
        };
      } else {
        populateVoicesList(voices);
      }
    } else {
      availableVoicesSelect.innerHTML = '<option>Speech synthesis not available in your browser</option>';
      voiceCountSpan.textContent = 'None (Speech API not available)';
    }
  }
  
  function populateVoicesList(voices) {
    availableVoicesSelect.innerHTML = '';
    
    if (voices.length === 0) {
      availableVoicesSelect.innerHTML = '<option>No voices available</option>';
      voiceCountSpan.textContent = '0';
      return;
    }
    
    voiceCountSpan.textContent = voices.length;
    
    voices.forEach(voice => {
      const option = document.createElement('option');
      option.textContent = `${voice.name} (${voice.lang}) ${voice.localService ? '- Local' : '- Network'}`;
      option.setAttribute('data-lang', voice.lang);
      option.setAttribute('data-name', voice.name);
      availableVoicesSelect.appendChild(option);
    });
  }
  
  voiceRateSlider.addEventListener('input', () => {
    const rate = parseFloat(voiceRateSlider.value);
    rateDisplay.textContent = `${rate}x`;
  });
  
  voicePitchSlider.addEventListener('input', () => {
    const pitch = parseFloat(voicePitchSlider.value);
    pitchDisplay.textContent = `${pitch}x`;
  });
  
  saveVoicesBtn.addEventListener('click', () => {
    const settings = {
      voiceRate: parseFloat(voiceRateSlider.value),
      voicePitch: parseFloat(voicePitchSlider.value)
    };
    
    chrome.storage.local.set(settings, () => {
      showStatusMessage(voicesStatusMsg, 'Voice settings saved successfully!', 'success');
    });
  });
  
  refreshVoicesBtn.addEventListener('click', () => {
    loadAvailableVoices();
    showStatusMessage(voicesStatusMsg, 'Voice list refreshed', 'success');
  });
  
  // Troubleshooting
  function loadTroubleshootingInfo() {
    // Browser info
    const userAgent = navigator.userAgent;
    let browserName = "Unknown Browser";
    
    if (userAgent.indexOf("Chrome") > -1) {
      browserName = "Google Chrome";
    } else if (userAgent.indexOf("Firefox") > -1) {
      browserName = "Mozilla Firefox";
    } else if (userAgent.indexOf("Safari") > -1) {
      browserName = "Apple Safari";
    } else if (userAgent.indexOf("Edge") > -1) {
      browserName = "Microsoft Edge";
    } else if (userAgent.indexOf("Opera") > -1) {
      browserName = "Opera";
    }
    
    browserInfoSpan.textContent = browserName;
    
    // Language info
    languageInfoSpan.textContent = navigator.language || 'Unknown';
    
    // Voice count is updated by loadAvailableVoices
  }
  
  testSpeechBtn.addEventListener('click', () => {
    const testText = testTextInput.value;
    
    if (!testText) {
      showStatusMessage(troubleshootingStatusMsg, 'Please enter some text to test', 'error');
      return;
    }
    
    if (!('speechSynthesis' in window)) {
      showStatusMessage(troubleshootingStatusMsg, 'Speech synthesis not available in your browser', 'error');
      return;
    }
    
    // Get voice settings
    chrome.storage.local.get(['voiceRate', 'voicePitch'], (result) => {
      const utterance = new SpeechSynthesisUtterance(testText);
      utterance.rate = result.voiceRate || 1.0;
      utterance.pitch = result.voicePitch || 1.0;
      utterance.lang = navigator.language;
      
      // Use browser's default voice
      speechSynthesis.speak(utterance);
      
      showStatusMessage(troubleshootingStatusMsg, 'Speaking test text...', 'success');
    });
  });
  
  resetSettingsBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to reset all settings to defaults? This cannot be undone.")) {
      chrome.storage.local.clear(() => {
        // Set up default settings again
        chrome.storage.local.set({
          autoSpeechEnabled: true,
          autoDetect: true,
          forcedLanguage: 'en-US',
          highlightStyle: 'default',
          customHighlightColor: 'rgba(255, 255, 0, 0.3)',
          voiceRate: 1.0,
          voicePitch: 1.0,
          triggerMode: 'hover',
          siteSettings: {}
        }, () => {
          // Reload all settings
          loadAllSettings();
          showStatusMessage(troubleshootingStatusMsg, 'All settings have been reset to defaults', 'success');
        });
      });
    }
  });
  
  // Utility functions
  function showStatusMessage(element, message, type) {
    element.textContent = message;
    element.className = 'status-message ' + type;
    element.style.display = 'block';
    
    setTimeout(() => {
      element.style.display = 'none';
    }, 3000);
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
  
  function loadAllSettings() {
    loadGeneralSettings();
    loadSiteSettings();
    loadVoiceSettings();
    loadTroubleshootingInfo();
  }
  
  // Initialize everything
  loadAllSettings();
});
