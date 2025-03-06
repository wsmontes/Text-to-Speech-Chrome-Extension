# Text-to-Speech Chrome Extension

> **Note:** This extension is currently under development and not yet published to the Chrome Web Store.

A powerful Chrome extension that converts text to speech on any webpage. Simply hover over text to have it read aloud to you.

## ✨ Features

- 🔊 Instant text-to-speech by hovering over content
- 🌐 Supports multiple languages with auto-detection
- ⚙️ Customizable voices, speech rate, and pitch
- 🛠️ Includes fixes for Chrome's speech synthesis limitations
- 💻 Works across most websites

## 📥 Installation (Developer Mode)

Since this extension is not yet published to the Chrome Web Store, you can install it in developer mode:

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions`
3. Enable "Developer mode" (toggle in the top-right corner)
4. Click "Load unpacked" and select the extension directory
5. The extension should now be installed and visible in your toolbar

## 🚀 Usage

1. Navigate to any webpage
2. Hover over text you want to hear
3. The extension will read the text aloud
4. Click anywhere to stop speech
5. Access additional options by clicking the extension icon in your toolbar

## ⚙️ Configuration

Click the extension icon to open settings where you can:

- Select preferred voice
- Adjust speech rate and pitch
- Toggle language auto-detection
- Customize activation behavior
- Enable/disable for specific sites

## ❓ Troubleshooting

### Speech Not Working?

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

### Common Issues

- **No sound at all**: Check if your computer's audio is muted
- **Speech cuts off**: This is a known Chrome bug, the extension tries to keep speech alive
- **Wrong language**: Try toggling the auto-detect setting or manually select a language
- **Text not detected**: Some complex page layouts may not work with hover detection

### Advanced Troubleshooting

Open the browser console (F12 or Ctrl+Shift+J) and look for messages starting with "TTS Extension". 
Report any errors you find when seeking support.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

If you encounter any issues not covered in the troubleshooting section, please open an issue in this repository's issue tracker.

## 🔮 Roadmap

- Initial public release on Chrome Web Store
- Additional language support
- Enhanced accessibility features
- Support for PDF documents
