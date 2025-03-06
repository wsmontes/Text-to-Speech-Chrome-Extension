# TTS Extension Troubleshooting Guide

## Speech Not Working?

If the text-to-speech functionality isn't working, try these steps:

1. **Refresh the page**: Sometimes the speech synthesis needs a page refresh to initialize properly.

2. **Open settings and test speech**: Click the extension icon and open settings, then use the "Test Speech" button in the Troubleshooting section.

3. **Refresh voices**: Use the "Refresh Voices" button in settings to reload available voices.

4. **Check browser compatibility**:
   - Chrome should have built-in TTS support
   - Make sure your browser is up to date
   - Confirm that no other extensions are blocking TTS

5. **Verify permissions**:
   - Make sure the extension has permission to run on the current site
   - Check that your system audio is working

6. **Known issues and fixes**:
   - Chrome has a bug where speech stops after about 15 seconds (our extension includes a fix)
   - Some websites block content scripts or have CSP restrictions

7. **Language support**:
   - If speech works but in the wrong language, try disabling auto-detection and manually select a language

## Common Issues

- **No sound at all**: Check if your computer's audio is muted
- **Speech cuts off**: This is a known Chrome bug, the extension tries to keep speech alive
- **Wrong language**: Try toggling the auto-detect setting or manually select a language
- **Text not detected**: Some complex page layouts may not work with hover detection

## Advanced Troubleshooting

Open the browser console (F12 or Ctrl+Shift+J) and look for messages starting with "TTS Extension". 
Report any errors you find when seeking support.
