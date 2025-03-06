"use strict";
console.log("TTS Extension: Content script initialized");

// ============================
// SETTINGS AND GLOBALS
// ============================
const CONFIG = {
  delayTime: 1000,  // Reduced from 2000ms to 1000ms
  highlightColors: {
    default: "rgba(255, 255, 0, 0.3)",
    subtle: "rgba(173, 216, 230, 0.3)",
    none: "transparent",
    custom: null  // Will be set from storage
  },
  notificationDuration: 2500,
  defaultVoiceRate: 1.0,
  defaultVoicePitch: 1.0
};

// State variables
let state = {
  autoSpeechEnabled: true,
  autoDetectLanguage: true,
  forcedLanguage: 'en-US',
  highlightStyle: 'default',
  customHighlightColor: CONFIG.highlightColors.default,
  voiceRate: CONFIG.defaultVoiceRate,
  voicePitch: CONFIG.defaultVoicePitch,
  triggerMode: 'hover',  // 'hover' or 'selection'
  lastHoveredEl: null,
  hoverTimer: null,
  currentUtterance: null,
  availableVoices: [],
  notificationEl: null,
  overlayVisible: false,
  siteEnabled: true  // Default to enabled
};

// Language patterns for improved detection
const LANGUAGE_PATTERNS = {
  "pt-BR": {
    pattern: /[ãõáàâéêíóôúç]/i,
    name: "Portuguese"
  },
  "es-ES": {
    pattern: /[áéíóúüñ¿¡]/i,
    name: "Spanish"
  },
  "fr-FR": {
    pattern: /[éèêëàâçîïôûùü]/i,
    name: "French"
  },
  "de-DE": {
    pattern: /[äöüßÄÖÜ]/i,
    name: "German"
  },
  "it-IT": {
    pattern: /[àèéìíîòóùú]/i,
    name: "Italian"
  },
  "ja-JP": {
    pattern: /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/,
    name: "Japanese"
  },
  "zh-CN": {
    pattern: /[\u4e00-\u9fff]/,
    name: "Chinese"
  },
  "ru-RU": {
    pattern: /[\u0400-\u04FF]/,
    name: "Russian"
  },
  "ar-SA": {
    pattern: /[\u0600-\u06FF]/,
    name: "Arabic"
  },
  "hi-IN": {
    pattern: /[\u0900-\u097F]/,
    name: "Hindi"
  }
};

// ============================
// INITIALIZATION
// ============================
// Enhanced voice loading function with multiple retry attempts
function preloadVoices() {
  console.log("TTS Extension: Starting voice preload process");
  
  // First attempt - immediate loading
  let voices = window.speechSynthesis.getVoices();
  if (voices && voices.length > 0) {
    state.availableVoices = voices;
    console.log(`TTS Extension: Loaded ${voices.length} voices immediately`);
    return;
  }
  
  console.log("TTS Extension: No voices available immediately, trying alternative methods");
  
  // Set up the voiceschanged event listener
  window.speechSynthesis.onvoiceschanged = () => {
    const updatedVoices = window.speechSynthesis.getVoices();
    if (updatedVoices.length > 0) {
      state.availableVoices = updatedVoices;
      console.log(`TTS Extension: Loaded ${updatedVoices.length} voices after voiceschanged event`);
    }
  };
  
  // Aggressive voice loading strategy with multiple attempts
  const attemptVoiceLoading = (attempt = 1, maxAttempts = 5) => {
    if (attempt > maxAttempts) {
      console.warn(`TTS Extension: Failed to load voices after ${maxAttempts} attempts`);
      return;
    }
    
    console.log(`TTS Extension: Voice loading attempt ${attempt}/${maxAttempts}`);
    
    // Try Chrome hack - create and speak an empty utterance to kickstart the synthesis engine
    try {
      const utterance = new SpeechSynthesisUtterance('');
      utterance.volume = 0; // Silent
      utterance.onend = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0 && state.availableVoices.length === 0) {
          state.availableVoices = voices;
          console.log(`TTS Extension: Loaded ${voices.length} voices after attempt ${attempt}`);
        } else if (voices.length === 0) {
          setTimeout(() => attemptVoiceLoading(attempt + 1), 300 * attempt); // Exponential backoff
        }
      };
      utterance.onerror = () => {
        setTimeout(() => attemptVoiceLoading(attempt + 1), 300 * attempt);
      };
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error(`TTS Extension: Error in voice loading attempt ${attempt}:`, err);
      setTimeout(() => attemptVoiceLoading(attempt + 1), 300 * attempt);
    }
  };
  
  // Start the attempts
  attemptVoiceLoading();
  
  // Final fallback after a longer delay
  setTimeout(() => {
    if (state.availableVoices.length === 0) {
      const finalAttempt = window.speechSynthesis.getVoices();
      if (finalAttempt.length > 0) {
        state.availableVoices = finalAttempt;
        console.log(`TTS Extension: Loaded ${finalAttempt.length} voices with final fallback`);
      } else {
        console.warn("TTS Extension: Could not load any voices even with fallbacks");
        showNotification("Warning: No speech voices available. Try refreshing the page.", "error");
      }
    }
  }, 2000);
}

// Enhanced refresh speech synthesis function
function refreshSpeechSynthesis() {
  window.speechSynthesis.cancel(); // Clear any pending speech
  
  // Force Chrome to wake up its speech engine
  window.speechSynthesis.resume();
  
  // Get fresh voices
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    state.availableVoices = voices;
    console.log(`TTS Extension: Refreshed speech synthesis. Available voices: ${voices.length}`);
  } else {
    console.log("TTS Extension: No voices found during refresh, trying preloadVoices");
    preloadVoices(); // Try the more aggressive loading approach
  }
  
  // Test speech synthesis with a silent utterance
  try {
    const testUtterance = new SpeechSynthesisUtterance("");
    testUtterance.volume = 0; // Silent
    testUtterance.onend = () => console.log("TTS Extension: Speech system responsive");
    testUtterance.onerror = (e) => console.error("TTS Extension: Speech system error:", e);
    window.speechSynthesis.speak(testUtterance);
  } catch (err) {
    console.error("TTS Extension: Error testing speech synthesis:", err);
  }
}

// Add an auto-refresh for Chrome speech engine which can go dormant
function keepSpeechEngineAlive() {
  // Every 30 seconds, ensure the speech engine is awake
  setInterval(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.resume();
      
      // If we have no voices, try to load them
      if (state.availableVoices.length === 0) {
        console.log("TTS Extension: No voices in periodic check, attempting reload");
        refreshSpeechSynthesis();
      }
    }
  }, 30000);
}

// Call this at initialization
keepSpeechEngineAlive();

// Call preloadVoices at initialization
preloadVoices();

// Also refresh speech synthesis after 500ms to ensure initialization
setTimeout(refreshSpeechSynthesis, 500);

// Load all settings from storage
chrome.storage.local.get(null, (result) => {
  state.autoSpeechEnabled = result.autoSpeechEnabled !== false;
  state.autoDetectLanguage = result.autoDetect !== false;
  state.forcedLanguage = result.forcedLanguage || 'en-US';
  state.highlightStyle = result.highlightStyle || 'default';
  state.customHighlightColor = result.customHighlightColor || CONFIG.highlightColors.default;
  state.voiceRate = result.voiceRate || CONFIG.defaultVoiceRate;
  state.voicePitch = result.voicePitch || CONFIG.defaultVoicePitch;
  state.triggerMode = result.triggerMode || 'hover';
  console.log("TTS Extension: Settings loaded", state);
});

// Listen for settings changes
chrome.storage.onChanged.addListener((changes, area) => {
  for (const [key, { newValue }] of Object.entries(changes)) {
    if (key in state) {
      state[key] = newValue;
      console.log(`TTS Extension: Setting updated - ${key}:`, newValue);
    }
  }
  
  // Clean up if auto speech is disabled
  if (changes.autoSpeechEnabled && !changes.autoSpeechEnabled.newValue) {
    stopAllSpeechActivity();
  }
});

// Initialize site settings
function initializeSiteSettings() {
  // Default to enabled for all sites
  state.siteEnabled = true;
  
  // Check if there are specific settings for this site
  const currentHost = window.location.hostname;
  
  chrome.storage.local.get('siteSettings', (result) => {
    if (result.siteSettings && result.siteSettings[currentHost] === false) {
      console.log(`TTS Extension: Disabled on ${currentHost} by user settings`);
      state.siteEnabled = false;
    }
  });
}

// Call this during initialization
initializeSiteSettings();

// ============================
// UTILITY FUNCTIONS
// ============================

function stopAllSpeechActivity() {
  if (state.hoverTimer) {
    clearTimeout(state.hoverTimer);
    state.hoverTimer = null;
  }
  
  if (state.lastHoveredEl) {
    resetHighlight(state.lastHoveredEl);
    state.lastHoveredEl = null;
  }
  
  window.speechSynthesis.cancel();
  removeNotification();
}

function resetHighlight(element) {
  if (element && element.style) {
    element.style.backgroundColor = '';
    element.style.transition = '';
  }
}

function applyHighlight(element) {
  if (!element) return;
  let color = CONFIG.highlightColors.default;
  
  switch (state.highlightStyle) {
    case 'none':
      color = CONFIG.highlightColors.none;
      break;
    case 'subtle':
      color = CONFIG.highlightColors.subtle;
      break;
    case 'custom':
      color = state.customHighlightColor;
      break;
    default:
      color = CONFIG.highlightColors.default;
  }
  
  element.style.backgroundColor = color;
  element.style.transition = 'background-color 0.3s ease';
}

// ============================
// LANGUAGE DETECTION & SPEECH
// ============================

function detectLanguage(text) {
  if (!text || typeof text !== 'string') return navigator.language || 'en-US';
  
  // Check text against language patterns
  for (const [langCode, langData] of Object.entries(LANGUAGE_PATTERNS)) {
    if (langData.pattern.test(text)) {
      console.log(`TTS Extension: Detected ${langData.name}`);
      return langCode;
    }
  }
  
  // Default to browser language or English
  return navigator.language || 'en-US';
}

function getVoiceForLanguage(langCode) {
  if (!langCode || state.availableVoices.length === 0) return null;
  
  // Try to find an exact match first
  let voice = state.availableVoices.find(v => v.lang === langCode);
  
  // If no exact match, try a partial match (e.g., 'en-US' would match 'en')
  if (!voice) {
    const langPrefix = langCode.split('-')[0];
    voice = state.availableVoices.find(v => v.lang.startsWith(langPrefix));
  }
  
  // If still no match, try to find any voice
  if (!voice && state.availableVoices.length > 0) {
    voice = state.availableVoices[0]; 
  }
  
  return voice;
}

function getLangName(langCode) {
  // Use language patterns if available
  if (LANGUAGE_PATTERNS[langCode]) {
    return LANGUAGE_PATTERNS[langCode].name;
  }
  
  // Try to get the language name from the browser
  try {
    return new Intl.DisplayNames([navigator.language], { type: 'language' })
      .of(langCode);
  } catch (e) {
    // Fallback to the code
    return langCode;
  }
}

function speakText(text, languageCode) {
  if (!text) {
    console.warn("TTS Extension: Empty text provided to speakText");
    return;
  }
  
  // Double check we have voices loaded
  if (state.availableVoices.length === 0) {
    state.availableVoices = window.speechSynthesis.getVoices();
    console.log(`TTS Extension: Refreshed voices before speaking. Count: ${state.availableVoices.length}`);
  }
  
  // Cancel any ongoing speech and clear pending speech
  window.speechSynthesis.cancel();
  
  // Give the speech synthesis a moment to reset
  setTimeout(() => {
    try {
      // Create and configure the utterance
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Use a valid language code
      utterance.lang = languageCode || navigator.language || 'en-US';
      utterance.rate = parseFloat(state.voiceRate) || CONFIG.defaultVoiceRate;
      utterance.pitch = parseFloat(state.voicePitch) || CONFIG.defaultVoicePitch;
      
      console.log(`TTS Extension: Speaking text in ${utterance.lang} (Rate: ${utterance.rate}, Pitch: ${utterance.pitch})`);
      console.log(`TTS Extension: Text to speak (first 50 chars): "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
      
      // Find a suitable voice
      const voice = getVoiceForLanguage(languageCode);
      if (voice) {
        utterance.voice = voice;
        console.log(`TTS Extension: Using voice: ${voice.name} (${voice.lang})`);
      } else {
        console.warn(`TTS Extension: No matching voice found for ${languageCode}`, 'using default');
      }
      
      // Event handlers
      utterance.onstart = () => {
        console.log(`TTS Extension: Started speaking in ${languageCode}`);
        showNotification(`Speaking in ${getLangName(languageCode)}...`, 'speaking');
      };
      
      utterance.onend = () => {
        console.log('TTS Extension: Finished speaking');
        removeNotification();
      };
      
      utterance.onerror = (event) => {
        console.error('TTS Extension: Speech error', event);
        showNotification(`Error: Could not speak text (${event.error})`, 'error');
        setTimeout(removeNotification, 2000);
      };
      
      // Store reference and speak
      state.currentUtterance = utterance;
      
      // Bug fix: Chrome sometimes doesn't speak if the synthesis isn't "active"
      // Force it to stay active by calling resume() before speaking
      window.speechSynthesis.resume();
      window.speechSynthesis.speak(utterance);
      
      // Chrome has a bug where speech stops after ~15 seconds
      // Keep it alive with a periodic resume() call
      const keepAlive = setInterval(() => {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.resume();
        } else {
          clearInterval(keepAlive);
        }
      }, 5000);
      
    } catch (error) {
      console.error('TTS Extension: Error in speech synthesis', error);
      showNotification('Error: Speech synthesis failed', 'error');
      setTimeout(removeNotification, 2000);
    }
  }, 100); // Small delay to ensure cancellation completes
}

function testSpeech() {
  console.log("TTS Extension: Running speech test");
  const testText = "This is a test of the speech synthesis system. If you can hear this, speech is working correctly.";
  
  showNotification("Running speech test...", 'loading');
  
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  
  // Create and speak a test utterance
  setTimeout(() => {
    try {
      const testUtterance = new SpeechSynthesisUtterance(testText);
      testUtterance.rate = parseFloat(state.voiceRate) || 1.0;
      testUtterance.pitch = parseFloat(state.voicePitch) || 1.0;
      testUtterance.volume = 1.0;
      testUtterance.lang = navigator.language || 'en-US';
      
      testUtterance.onstart = () => {
        console.log("TTS Extension: Test speech started successfully");
        showNotification("Speech test in progress...", 'speaking');
      };
      
      testUtterance.onend = () => {
        console.log("TTS Extension: Test speech completed successfully");
        showNotification("Speech test completed successfully!", 'info');
        setTimeout(removeNotification, 2000);
      };
      
      testUtterance.onerror = (e) => {
        console.error("TTS Extension: Test speech error", e);
        attemptSpeechRecovery(testText, navigator.language || 'en-US');
      };
      
      // Speak the test utterance
      window.speechSynthesis.resume();
      window.speechSynthesis.speak(testUtterance);
      
      // Check if speech started
      setTimeout(() => {
        if (!window.speechSynthesis.speaking) {
          console.warn("TTS Extension: Speech didn't start in expected time, trying recovery");
          attemptSpeechRecovery(testText, navigator.language || 'en-US');
        }
      }, 1000);
      
    } catch (error) {
      console.error("TTS Extension: Error during speech test", error);
      showNotification("Error running speech test", 'error');
    }
  }, 200);
}

// Add a speech recovery function that we can use if speech fails
function attemptSpeechRecovery(textToSpeak, languageCode) {
  console.log("TTS Extension: Attempting speech recovery");
  
  // Show notification to the user
  showNotification("Speech system recovery in progress...", 'loading');
  
  // Reset the speech synthesis
  window.speechSynthesis.cancel();
  
  // Force a reload of voices
  setTimeout(() => {
    // Get fresh voices
    const freshVoices = window.speechSynthesis.getVoices();
    if (freshVoices && freshVoices.length > 0) {
      state.availableVoices = freshVoices;
      console.log(`TTS Extension: Recovered ${freshVoices.length} voices`);
    }
    
    // Try speaking again with a simple utterance first
    const testUtterance = new SpeechSynthesisUtterance("Test");
    testUtterance.volume = 0.1; // Very quiet
    testUtterance.onend = () => {
      console.log("TTS Extension: Recovery test successful, trying original text");
      setTimeout(() => speakText(textToSpeak, languageCode), 200);
    };
    testUtterance.onerror = () => {
      console.error("TTS Extension: Recovery test failed");
      showNotification("Speech system unavailable. Try refreshing the page.", 'error');
    };
    
    window.speechSynthesis.speak(testUtterance);
  }, 300);
}

// ============================
// UI COMPONENTS
// ============================

function showNotification(message, type = 'info') {
  removeNotification();
  
  state.notificationEl = document.createElement('div');
  const notif = state.notificationEl;
  
  // Base styles
  notif.style.position = 'fixed';
  notif.style.bottom = '20px';
  notif.style.right = '20px';
  notif.style.padding = '12px 20px';
  notif.style.borderRadius = '8px';
  notif.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  notif.style.zIndex = 99999;
  notif.style.fontFamily = 'Arial, sans-serif';
  notif.style.fontSize = '14px';
  notif.style.transition = 'opacity 0.3s ease';
  notif.style.display = 'flex';
  notif.style.alignItems = 'center';
  notif.style.gap = '10px';
  
  // Type-specific styles
  if (type === 'info') {
    notif.style.backgroundColor = '#f0f7ff';
    notif.style.color = '#0066cc';
    notif.style.border = '1px solid #cce5ff';
  } else if (type === 'speaking') {
    notif.style.backgroundColor = '#e6f7e6';
    notif.style.color = '#006600';
    notif.style.border = '1px solid #b3e6b3';
    
    // Add a speaking animation
    const icon = document.createElement('div');
    icon.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 3V21M17 6V18M7 8V16M22 9V15M2 11V13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `;
    notif.prepend(icon);
  } else if (type === 'error') {
    notif.style.backgroundColor = '#ffebee';
    notif.style.color = '#c62828';
    notif.style.border = '1px solid #ffcdd2';
  } else if (type === 'loading') {
    notif.style.backgroundColor = '#fff8e1';
    notif.style.color = '#ff8f00';
    notif.style.border = '1px solid #ffe082';
    
    // Add a loading spinner
    const spinner = document.createElement('div');
    spinner.style.width = '16px';
    spinner.style.height = '16px';
    spinner.style.border = '3px solid rgba(0, 0, 0, 0.1)';
    spinner.style.borderTop = '3px solid currentColor';
    spinner.style.borderRadius = '50%';
    spinner.style.animation = 'tts-spin 1s linear infinite';
    
    // Add keyframes for the spinner
    const style = document.createElement('style');
    style.textContent = `
      @keyframes tts-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    notif.prepend(spinner);
  }
  
  notif.textContent = message;
  document.body.appendChild(notif);
  
  // Fade in animation
  notif.style.opacity = '0';
  setTimeout(() => {
    if (notif.parentNode) notif.style.opacity = '1';
  }, 10);
}

function removeNotification() {
  if (state.notificationEl) {
    const notif = state.notificationEl;
    
    // Fade out animation
    notif.style.opacity = '0';
    setTimeout(() => {
      if (notif.parentNode) notif.remove();
    }, 300);
    
    state.notificationEl = null;
  }
}

// Update createSettingsOverlay function to include site-specific settings
function createSettingsOverlay() {
  let overlay = document.createElement('div');
  overlay.id = 'tts-settings-overlay';
  overlay.style.position = 'fixed';
  overlay.style.bottom = '20px';
  overlay.style.right = '20px';
  overlay.style.width = '300px';
  overlay.style.padding = '20px';
  overlay.style.backgroundColor = '#ffffff';
  overlay.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.2)';
  overlay.style.borderRadius = '10px';
  overlay.style.zIndex = 100000;
  overlay.style.fontFamily = 'Arial, sans-serif';
  overlay.style.fontSize = '14px';
  overlay.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
  overlay.style.transform = 'translateY(20px)';
  overlay.style.opacity = '0';
  
  overlay.innerHTML = `
    <style>
      #tts-settings-overlay h3 {
        margin-top: 0;
        margin-bottom: 15px;
        font-size: 18px;
        color: #333;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      #tts-settings-overlay .close-btn {
        cursor: pointer;
        font-size: 22px;
        color: #999;
      }
      #tts-settings-overlay .close-btn:hover {
        color: #333;
      }
      #tts-settings-overlay .section {
        margin-bottom: 15px;
        padding-bottom: 15px;
        border-bottom: 1px solid #eee;
      }
      #tts-settings-overlay label {
        display: block;
        margin-bottom: 8px;
        color: #555;
      }
      #tts-settings-overlay select,
      #tts-settings-overlay input[type="range"],
      #tts-settings-overlay input[type="color"] {
        width: 100%;
        padding: 5px;
        border-radius: 4px;
        border: 1px solid #ddd;
        margin-bottom: 10px;
      }
      #tts-settings-overlay .checkbox-container {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
      }
      #tts-settings-overlay .checkbox-container input[type="checkbox"] {
        margin-right: 8px;
      }
      #tts-settings-overlay .radio-group {
        margin-bottom: 10px;
      }
      #tts-settings-overlay .radio-option {
        display: flex;
        align-items: center;
        margin-bottom: 5px;
      }
      #tts-settings-overlay .radio-option input {
        margin-right: 8px;
      }
      #tts-settings-overlay .value-display {
        display: inline-block;
        min-width: 30px;
        text-align: right;
        margin-left: 8px;
        color: #666;
      }
      #tts-settings-overlay .info {
        font-size: 12px;
        color: #666;
        margin-top: -5px;
        margin-bottom: 10px;
      }
    </style>
    
    <h3>
      Text-to-Speech Settings
      <span class="close-btn">&times;</span>
    </h3>
    <div class="section">
      <div class="checkbox-container">
        <input type="checkbox" id="tts-auto-speech" ${state.autoSpeechEnabled ? 'checked' : ''}>
        <label for="tts-auto-speech">Enable Auto Speech</label>
      </div>
      <div class="radio-group">
        <label>Trigger Mode:</label>
        <div class="radio-option">
          <input type="radio" id="tts-trigger-hover" name="triggerMode" value="hover" ${state.triggerMode === 'hover' ? 'checked' : ''}>
          <label for="tts-trigger-hover">On Hover</label>
        </div>
        <div class="radio-option">
          <input type="radio" id="tts-trigger-selection" name="triggerMode" value="selection" ${state.triggerMode === 'selection' ? 'checked' : ''}>
          <label for="tts-trigger-selection">On Text Selection</label>
        </div>
      </div>
    </div>
    <div class="section">
      <div class="checkbox-container">
        <input type="checkbox" id="tts-auto-detect" ${state.autoDetectLanguage ? 'checked' : ''}>
        <label for="tts-auto-detect">Auto-detect Text Language</label>
      </div>
      <label for="tts-forced-lang">Force Language:</label>
      <select id="tts-forced-lang" ${state.autoDetectLanguage ? 'disabled' : ''}>
        <option value="en-US" ${state.forcedLanguage === 'en-US' ? 'selected' : ''}>English (US)</option>
        <option value="pt-BR" ${state.forcedLanguage === 'pt-BR' ? 'selected' : ''}>Portuguese (Brazil)</option>
        <option value="es-ES" ${state.forcedLanguage === 'es-ES' ? 'selected' : ''}>Spanish (Spain)</option>
        <option value="fr-FR" ${state.forcedLanguage === 'fr-FR' ? 'selected' : ''}>French (France)</option>
        <option value="de-DE" ${state.forcedLanguage === 'de-DE' ? 'selected' : ''}>German (Germany)</option>
        <option value="it-IT" ${state.forcedLanguage === 'it-IT' ? 'selected' : ''}>Italian (Italy)</option>
        <option value="ja-JP" ${state.forcedLanguage === 'ja-JP' ? 'selected' : ''}>Japanese</option>
        <option value="zh-CN" ${state.forcedLanguage === 'zh-CN' ? 'selected' : ''}>Chinese (China)</option>
        <option value="ru-RU" ${state.forcedLanguage === 'ru-RU' ? 'selected' : ''}>Russian</option>
        <option value="ar-SA" ${state.forcedLanguage === 'ar-SA' ? 'selected' : ''}>Arabic (Saudi Arabia)</option>
        <option value="hi-IN" ${state.forcedLanguage === 'hi-IN' ? 'selected' : ''}>Hindi (India)</option>
      </select>
    </div>
    <div class="section">
      <label for="tts-highlight-style">Highlight Style:</label>
      <select id="tts-highlight-style">
        <option value="default" ${state.highlightStyle === 'default' ? 'selected' : ''}>Default (Yellow)</option>
        <option value="subtle" ${state.highlightStyle === 'subtle' ? 'selected' : ''}>Subtle (Light Blue)</option>
        <option value="custom" ${state.highlightStyle === 'custom' ? 'selected' : ''}>Custom Color</option>
        <option value="none" ${state.highlightStyle === 'none' ? 'selected' : ''}>No Highlight</option>
      </select>
      
      <div id="custom-color-container" style="display: ${state.highlightStyle === 'custom' ? 'block' : 'none'}">
        <label for="tts-custom-color">Custom Color:</label>
        <input type="color" id="tts-custom-color" value="${state.customHighlightColor}">
      </div>
    </div>
    <div class="section">
      <label for="tts-voice-rate">
        Speech Rate: <span class="value-display">${state.voiceRate}x</span>
      </label>
      <input type="range" id="tts-voice-rate" min="0.5" max="2" step="0.1" value="${state.voiceRate}">
      
      <label for="tts-voice-pitch">
        Voice Pitch: <span class="value-display">${state.voicePitch}x</span>
      </label>
      <input type="range" id="tts-voice-pitch" min="0.5" max="2" step="0.1" value="${state.voicePitch}">
    </div>
    <div>
      <p class="info">Detected browser language: ${navigator.language || 'en-US'}</p>
      <p class="info">Available voices: ${state.availableVoices.length}</p>
      <p class="info">TIP: Press Alt+S to toggle speech for selected text</p>
    </div>
    <div class="section">
      <h4 style="margin-top:0;margin-bottom:10px;">Troubleshooting</h4>
      <button id="tts-test-speech" style="padding:5px 10px;background:#4285f4;color:white;border:none;border-radius:4px;cursor:pointer;margin-right:10px;">
        Test Speech
      </button>
      <button id="tts-refresh-voices" style="padding:5px 10px;background:#34a853;color:white;border:none;border-radius:4px;cursor:pointer;">
        Refresh Voices
      </button>
      <div class="info" id="voice-status"></div>
    </div>
    <h4 style="margin-top:0;margin-bottom:10px;">Site Settings</h4>
    <div class="section">
      <div class="checkbox-container">
        <input type="checkbox" id="tts-enable-for-site" checked>
        <label for="tts-enable-for-site">Enable TTS on this site</label>
      </div>
      <p class="info">Current site: <span id="tts-current-site">...</span></p>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // Animate in
  setTimeout(() => {
    overlay.style.transform = 'translateY(0)';
    overlay.style.opacity = '1';
  }, 10);
  
  // Add event listeners
  overlay.querySelector('.close-btn').addEventListener('click', () => {
    toggleSettingsOverlay();
  });
  
  overlay.querySelector('#tts-auto-speech').addEventListener('change', (e) => {
    state.autoSpeechEnabled = e.target.checked;
    chrome.storage.local.set({ autoSpeechEnabled: state.autoSpeechEnabled });
  });
  
  overlay.querySelector('#tts-auto-detect').addEventListener('change', (e) => {
    state.autoDetectLanguage = e.target.checked;
    chrome.storage.local.set({ autoDetect: state.autoDetectLanguage });
    
    // Enable/disable the forced language dropdown
    const forcedLangSelect = document.getElementById('tts-forced-lang');
    if (forcedLangSelect) {
      forcedLangSelect.disabled = state.autoDetectLanguage;
    }
  });
  
  overlay.querySelector('#tts-forced-lang').addEventListener('change', (e) => {
    state.forcedLanguage = e.target.value;
    chrome.storage.local.set({ forcedLanguage: state.forcedLanguage });
  });
  
  overlay.querySelectorAll('input[name="triggerMode"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.checked) {
        state.triggerMode = e.target.value;
        chrome.storage.local.set({ triggerMode: state.triggerMode });
      }
    });
  });
  
  overlay.querySelector('#tts-highlight-style').addEventListener('change', (e) => {
    state.highlightStyle = e.target.value;
    chrome.storage.local.set({ highlightStyle: state.highlightStyle });
    
    // Show/hide custom color picker
    const customColorContainer = document.getElementById('custom-color-container');
    if (customColorContainer) {
      customColorContainer.style.display = state.highlightStyle === 'custom' ? 'block' : 'none';
    }
  });
  
  overlay.querySelector('#tts-custom-color').addEventListener('change', (e) => {
    state.customHighlightColor = e.target.value;
    chrome.storage.local.set({ customHighlightColor: state.customHighlightColor });
  });
  
  const rateSlider = overlay.querySelector('#tts-voice-rate');
  const rateDisplay = rateSlider.parentElement.querySelector('.value-display');
  rateSlider.addEventListener('input', (e) => {
    state.voiceRate = parseFloat(e.target.value);
    rateDisplay.textContent = `${state.voiceRate}x`;
  });
  rateSlider.addEventListener('change', () => {
    chrome.storage.local.set({ voiceRate: state.voiceRate });
  });
  
  const pitchSlider = overlay.querySelector('#tts-voice-pitch');
  const pitchDisplay = pitchSlider.parentElement.querySelector('.value-display');
  pitchSlider.addEventListener('input', (e) => {
    state.voicePitch = parseFloat(e.target.value);
    pitchDisplay.textContent = `${state.voicePitch}x`;
  });
  pitchSlider.addEventListener('change', () => {
    chrome.storage.local.set({ voicePitch: state.voicePitch });
  });
  
  // Add event listeners for the debug buttons
  overlay.querySelector('#tts-test-speech').addEventListener('click', () => {
    testSpeech();
  });
  
  overlay.querySelector('#tts-refresh-voices').addEventListener('click', () => {
    const statusEl = overlay.querySelector('#voice-status');
    statusEl.textContent = "Refreshing voices...";
    
    setTimeout(() => {
      refreshSpeechSynthesis();
      const voices = window.speechSynthesis.getVoices();
      state.availableVoices = voices;
      statusEl.textContent = `Found ${voices.length} voices.`;
      
      setTimeout(() => {
        if (voices.length > 0) {
          statusEl.textContent = `Available voices: ${voices.length} (First: ${voices[0].name})`;
        } else {
          statusEl.textContent = "No voices available. Speech may not work.";
        }
      }, 500);
    }, 200);
  });
  
  // Add site permission handling
  const currentHost = window.location.hostname;
  document.getElementById('tts-current-site').textContent = currentHost;
  const siteEnabledCheckbox = document.getElementById('tts-enable-for-site');
  
  chrome.storage.local.get('siteSettings', (result) => {
    const siteSettings = result.siteSettings || {};
    siteEnabledCheckbox.checked = siteSettings[currentHost] !== false; // Default to enabled
    
    siteEnabledCheckbox.addEventListener('change', (e) => {
      siteSettings[currentHost] = e.target.checked;
      chrome.storage.local.set({ siteSettings });
      
      // Show notification about the setting change
      if (e.target.checked) {
        showNotification(`TTS enabled on ${currentHost}`, 'info');
      } else {
        showNotification(`TTS disabled on ${currentHost}`, 'info');
      }
    });
  });
  
  return overlay;
}

function toggleSettingsOverlay() {
  let overlay = document.getElementById('tts-settings-overlay');
  
  if (overlay) {
    // Animate out
    overlay.style.transform = 'translateY(20px)';
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.remove();
      state.overlayVisible = false;
    }, 300);
  } else {
    createSettingsOverlay();
    state.overlayVisible = true;
  }
}

// ============================
// EVENT LISTENERS
// ============================

// Hover-based text reading
document.addEventListener('mouseover', (event) => {
  if (!state.siteEnabled || !state.autoSpeechEnabled || state.triggerMode !== 'hover') return;
  
  const target = event.target;
  if (target.nodeType !== Node.ELEMENT_NODE) return;
  if (typeof target.innerText !== 'string' || !target.innerText.trim()) return;
  if (target.closest('#tts-settings-overlay') || target.closest('#tts-notification')) return;  // Don't activate on our own UI elements
  
  if (state.hoverTimer) {
    clearTimeout(state.hoverTimer);
    state.hoverTimer = null;
  }
  
  applyHighlight(target);
  state.lastHoveredEl = target;
  
  state.hoverTimer = setTimeout(() => {
    const text = target.innerText.trim();
    if (!text) {
      removeNotification();
      return;
    }
    
    // Determine language
    const detectedLang = state.autoDetectLanguage 
      ? detectLanguage(text) 
      : state.forcedLanguage;
      
    // Show loading notification
    showNotification("Preparing speech...", 'loading');
    
    // Speak the text
    setTimeout(() => {
      speakText(text, detectedLang);
    }, CONFIG.delayTime);
  }, CONFIG.delayTime);
});

document.addEventListener('mouseout', (event) => {
  const target = event.target;
  if (target === state.lastHoveredEl) {
    if (state.hoverTimer) {
      clearTimeout(state.hoverTimer);
      state.hoverTimer = null;
    }
    
    resetHighlight(target);
    state.lastHoveredEl = null;
    
    // Only cancel speech and remove notification if we're not in selection mode
    // This allows the speech to continue when the user moves the mouse away
    if (state.triggerMode !== 'selection') {
      window.speechSynthesis.cancel();
      removeNotification();
    }
  }
});

// Text selection-based reading
document.addEventListener('mouseup', (event) => {
  if (!state.autoSpeechEnabled || state.triggerMode !== 'selection') return;
  
  setTimeout(() => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    if (text) {
      // Determine language
      const detectedLang = state.autoDetectLanguage 
        ? detectLanguage(text) 
        : state.forcedLanguage;
        
      // Show loading notification
      showNotification("Preparing speech...", 'loading');
      
      // Small delay to allow the UI to update
      setTimeout(() => {
        // Speak the text
        speakText(text, detectedLang);
      }, 200);
    }
  }, 10);
});

// Handle keyboard shortcut Alt+S to speak selected text
document.addEventListener('keydown', (event) => {
  // Alt+S to speak selected text
  if (event.altKey && event.code === 'KeyS') {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    if (text) {
      // Determine language
      const detectedLang = state.autoDetectLanguage 
        ? detectLanguage(text) 
        : state.forcedLanguage;
        
      // Show loading notification
      showNotification("Preparing speech...", 'loading');
      
      // Small delay to allow the UI to update
      setTimeout(() => {
        // Speak the text
        speakText(text, detectedLang);
      }, 200);
    }
  }
});

// Listen for messages to toggle the overlay popup (persistent settings)
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "toggle-popup") {
    toggleSettingsOverlay();
  } else if (message.action === "speak-selection") {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    if (text) {
      const detectedLang = state.autoDetectLanguage 
        ? detectLanguage(text) 
        : state.forcedLanguage;
      
      showNotification("Preparing speech...", 'loading');
      setTimeout(() => {
        speakText(text, detectedLang);
      }, 200);
    }
  } else if (message.action === "test-speech") {
    testSpeech();
  } else if (message.action === "refresh-voices") {
    refreshSpeechSynthesis();
    showNotification("Refreshing speech voices...", 'info');
    setTimeout(() => removeNotification(), 2000);
  }
});

// Call refresh on window focus, as Chrome sometimes unloads speech synthesis
window.addEventListener('focus', () => {
  setTimeout(refreshSpeechSynthesis, 300);
});
