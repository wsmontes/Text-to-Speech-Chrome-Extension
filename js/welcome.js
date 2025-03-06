document.addEventListener('DOMContentLoaded', function() {
  // Voice selector and controls
  const voiceSelect = document.getElementById('voice-select');
  const rateSlider = document.getElementById('rate-slider');
  const rateValue = document.getElementById('rate-value');
  const pitchSlider = document.getElementById('pitch-slider');
  const pitchValue = document.getElementById('pitch-value');
  const voiceControls = document.getElementById('voice-controls');
  const statusMessage = document.getElementById('status-message');
  
  // Initialize speech synthesis
  let voices = [];
  
  function populateVoiceList() {
    try {
      voices = window.speechSynthesis.getVoices();
      
      if (voices.length === 0) {
        setTimeout(populateVoiceList, 100);
        return;
      }
      
      // Clear existing options
      voiceSelect.innerHTML = '';
      
      // Add voices to select element
      voices.forEach((voice, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${voice.name} (${voice.lang})`;
        
        if (voice.default) {
          option.selected = true;
        }
        
        voiceSelect.appendChild(option);
      });
    } catch (error) {
      console.error('Error populating voice list:', error);
      showStatus('Unable to load voices. Your browser may have restrictions on speech synthesis.', true);
    }
  }
  
  // Initialize voice list
  try {
    populateVoiceList();
    
    // Chrome needs this event to properly populate voices
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = populateVoiceList;
    }
  } catch (error) {
    console.error('Speech synthesis initialization error:', error);
    showStatus('Speech synthesis not available in this context', true);
  }
  
  // Show status message
  function showStatus(message, isError = false) {
    statusMessage.textContent = message;
    statusMessage.className = isError ? 'status status-error' : 'status status-success';
    statusMessage.style.display = 'block';
    
    setTimeout(() => {
      statusMessage.style.display = 'none';
    }, 5000);
  }
  
  // Update sliders
  rateSlider.addEventListener('input', () => {
    rateValue.textContent = rateSlider.value;
  });
  
  pitchSlider.addEventListener('input', () => {
    pitchValue.textContent = pitchSlider.value;
  });
  
  // Voice control toggles
  document.getElementById('show-voice-options').addEventListener('click', function() {
    voiceControls.style.display = 'block';
  });
  
  document.getElementById('hide-voice-options').addEventListener('click', function() {
    voiceControls.style.display = 'none';
  });
  
  // Test speech functionality - Use message passing to communicate with background script
  document.getElementById('test-speech').addEventListener('click', function() {
    try {
      // For extension pages, use chrome.tts API instead of direct Web Speech API
      if (chrome && chrome.tts) {
        // Use the extension's TTS API (more reliable in extension context)
        const options = {
          rate: parseFloat(rateSlider.value),
          pitch: parseFloat(pitchSlider.value),
          onEvent: function(event) {
            if (event.type === 'error') {
              showStatus(`Speech error: ${event.errorMessage || 'Unknown error'}`, true);
            } else if (event.type === 'end') {
              showStatus('Speech test completed successfully');
            }
          }
        };
        
        // Try to use selected voice if possible
        if (voiceSelect.selectedIndex >= 0 && voices.length > 0) {
          const selectedVoice = voices[voiceSelect.value];
          if (selectedVoice) {
            options.voiceName = selectedVoice.name;
          }
        }
        
        chrome.tts.speak(
          "Welcome to the Text to Speech Extension. This is a test to ensure your browser's text-to-speech functionality is working correctly.",
          options
        );
      } else {
        // Fallback to Web Speech API for non-extension contexts (with limitations)
        if ("speechSynthesis" in window) {
          // Stop any ongoing speech
          window.speechSynthesis.cancel();
          
          // Fix Chrome's bug where speech synthesis stops after ~15 seconds
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
          
          const utterance = new SpeechSynthesisUtterance(
            "Welcome to the Text to Speech Extension. This is a test to ensure your browser's text-to-speech functionality is working correctly."
          );
          
          // Apply selected voice if available
          if (voices.length > 0) {
            const selectedVoice = voices[voiceSelect.value];
            if (selectedVoice) {
              utterance.voice = selectedVoice;
            }
          }
          
          // Apply rate and pitch
          utterance.rate = parseFloat(rateSlider.value);
          utterance.pitch = parseFloat(pitchSlider.value);
          utterance.volume = 1.0;
          
          // Handle errors
          utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            showStatus(`Speech error: ${event.error || 'Unknown error'}`, true);
          };
          
          utterance.onend = () => {
            showStatus('Speech test completed successfully');
          };
          
          // Speak
          window.speechSynthesis.speak(utterance);
          
          // Chrome bug workaround - keep speech synthesis active
          const intervalId = setInterval(() => {
            if (!window.speechSynthesis.speaking) {
              clearInterval(intervalId);
            } else if (window.speechSynthesis.paused) {
              window.speechSynthesis.resume();
            }
          }, 5000);
        } else {
          showStatus('Speech synthesis not supported in your browser', true);
        }
      }
    } catch (error) {
      console.error('Error initializing speech:', error);
      showStatus(`Error initializing speech: ${error.message}`, true);
    }
  });
  
  document.getElementById('open-options').addEventListener('click', function() {
    try {
      if (chrome.runtime && chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      } else {
        showStatus('Unable to open options page. Please access it from your browser extensions menu.', true);
      }
    } catch (error) {
      console.error('Error opening options page:', error);
      showStatus('Unable to open options page: ' + error.message, true);
    }
  });
});
