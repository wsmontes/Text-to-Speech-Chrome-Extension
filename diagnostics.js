/**
 * TTS Extension Diagnostics Tool
 * 
 * This file contains diagnostic functions to help troubleshoot speech synthesis issues.
 * It can be injected into the page for deeper analysis of speech problems.
 */

(function() {
  'use strict';
  
  const TTS_DIAGNOSTICS = {
    version: '1.0.0',
    
    // Run all diagnostic tests
    runAll: function() {
      console.group('TTS Extension Diagnostics');
      console.log('Running full diagnostic suite...');
      
      this.checkSpeechSynthesisAvailability();
      this.checkVoicesAvailability();
      this.testSimpleSpeech();
      this.checkAudioOutput();
      this.checkBrowserCompatibility();
      
      console.groupEnd();
      
      return "Diagnostics complete. Check the console for results.";
    },
    
    // Check if speech synthesis is available
    checkSpeechSynthesisAvailability: function() {
      console.group('1. Speech Synthesis Availability');
      
      if ('speechSynthesis' in window) {
        console.log('✅ Speech Synthesis API is available');
        
        if (window.speechSynthesis.pending) {
          console.warn('⚠️ Speech synthesis has pending speech');
        }
        
        if (window.speechSynthesis.speaking) {
          console.warn('⚠️ Speech synthesis is currently speaking');
        }
        
        if (window.speechSynthesis.paused) {
          console.warn('⚠️ Speech synthesis is paused');
        }
        
      } else {
        console.error('❌ Speech Synthesis API is NOT available in this browser');
      }
      
      console.groupEnd();
      return 'speechSynthesis' in window;
    },
    
    // Check if voices are available
    checkVoicesAvailability: function() {
      console.group('2. Voices Availability');
      
      if (!('speechSynthesis' in window)) {
        console.error('❌ Speech Synthesis API is not available, cannot check voices');
        console.groupEnd();
        return false;
      }
      
      const voices = window.speechSynthesis.getVoices();
      
      if (voices && voices.length > 0) {
        console.log(`✅ ${voices.length} voices available`);
        
        // Log some sample voices
        console.group('Sample Voices');
        for (let i = 0; i < Math.min(voices.length, 5); i++) {
          const voice = voices[i];
          console.log(`Voice ${i+1}: ${voice.name} (${voice.lang}), ${voice.localService ? 'Local' : 'Remote'}`);
        }
        if (voices.length > 5) {
          console.log(`... and ${voices.length - 5} more voices`);
        }
        console.groupEnd();
        
      } else {
        console.error('❌ No voices available');
        console.log('Attempting to wait for voices...');
        
        // Try to wait for voices
        window.speechSynthesis.onvoiceschanged = function() {
          const newVoices = window.speechSynthesis.getVoices();
          console.log(`After waiting: ${newVoices.length} voices available`);
        };
      }
      
      console.groupEnd();
      return voices && voices.length > 0;
    },
    
    // Test a simple speech utterance
    testSimpleSpeech: function() {
      console.group('3. Simple Speech Test');
      
      if (!('speechSynthesis' in window)) {
        console.error('❌ Speech Synthesis API is not available, cannot test speech');
        console.groupEnd();
        return false;
      }
      
      try {
        const utterance = new SpeechSynthesisUtterance('This is a diagnostic test for speech synthesis.');
        
        utterance.onstart = function() {
          console.log('✅ Speech test started successfully');
        };
        
        utterance.onend = function() {
          console.log('✅ Speech test completed successfully');
        };
        
        utterance.onerror = function(event) {
          console.error(`❌ Speech test error: ${event.error}`);
          console.error('Error details:', event);
        };
        
        window.speechSynthesis.cancel(); // Clear any pending speech
        window.speechSynthesis.speak(utterance);
        
        console.log('Speech test utterance queued. Listen for audio...');
      } catch (error) {
        console.error('❌ Exception when attempting speech:', error);
      }
      
      console.groupEnd();
    },
    
    // Check for audio output issues
    checkAudioOutput: function() {
      console.group('4. Audio Output Check');
      
      // No direct way to check audio from JS, provide guidance for manual check
      console.log('Cannot automatically verify audio output. Please check:');
      console.log('- System is not muted');
      console.log('- Browser has permission to play sound');
      console.log('- Audio output device is connected and working');
      
      // Try to play a silent audio to check permissions
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        if (audioContext) {
          console.log('✅ AudioContext created successfully');
          
          if (audioContext.state === 'running') {
            console.log('✅ AudioContext is in running state');
          } else {
            console.warn(`⚠️ AudioContext state is "${audioContext.state}"`);
            console.log('This may prevent audio from playing correctly');
          }
        }
      } catch (error) {
        console.error('❌ Could not create AudioContext:', error);
        console.log('This might indicate audio permission issues');
      }
      
      console.groupEnd();
    },
    
    // Check browser compatibility
    checkBrowserCompatibility: function() {
      console.group('5. Browser Compatibility');
      
      const userAgent = navigator.userAgent;
      console.log('User Agent:', userAgent);
      
      // Check for Chrome
      if (userAgent.indexOf('Chrome') > -1) {
        console.log('✅ Browser is Chrome or Chrome-based (good compatibility)');
      } 
      // Check for Firefox
      else if (userAgent.indexOf('Firefox') > -1) {
        console.log('⚠️ Browser is Firefox (partial compatibility)');
        console.log('Some voices might not be available in Firefox');
      } 
      // Check for Safari
      else if (userAgent.indexOf('Safari') > -1) {
        console.log('⚠️ Browser is Safari (partial compatibility)');
        console.log('Safari might have limited voice options');
      } 
      // Other browsers
      else {
        console.warn('⚠️ Browser not specifically identified, compatibility unknown');
      }
      
      // Check for mobile
      if (/Android|iPhone|iPad|iPod|webOS/i.test(userAgent)) {
        console.warn('⚠️ Mobile browser detected - speech synthesis may have limitations');
      }
      
      console.groupEnd();
    }
  };
  
  // Export diagnostics to the window for use in the console
  window.TTSDiagnostics = TTS_DIAGNOSTICS;
  
  console.log('TTS Diagnostics tool loaded. Run window.TTSDiagnostics.runAll() in the console to diagnose issues.');
  
  // Return the diagnostics object
  return TTS_DIAGNOSTICS;
})();
