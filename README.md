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

## 📋 Chrome Web Store Permissions

### Storage Permission
The storage permission is required to save user preferences such as selected voice, speech rate, pitch settings, language preferences, and website-specific configurations. This ensures your settings persist across browser sessions.

### ActiveTab Permission
The activeTab permission is necessary to access text content on the current webpage when the user hovers over or selects text. This permission is triggered only when the user actively interacts with the extension and only affects the currently active tab.

### ContextMenus Permission
The contextMenus permission allows the extension to add a right-click menu option for users to select specific text and have it read aloud. This enhances accessibility by providing an alternative to the hover activation method.

### TTS Permission
The Text-to-Speech (tts) permission is essential for the extension's core functionality, allowing it to convert text to audible speech using Chrome's built-in speech synthesis capabilities.

### Host Permission
Host permissions are required for the extension to function across all websites, which is necessary to fulfill its purpose of providing text-to-speech capabilities on any webpage. The extension only accesses visible text content when triggered by user action (hovering or selection) and does not collect or transmit this data.

## 🔒 Privacy Information

### Data Collection
This extension does not collect, store, or transmit any personal data. When text is converted to speech, the process happens locally in your browser. No text content, browsing history, or user information is sent to external servers.

- No personally identifiable information is collected
- No website content is stored or transmitted
- User preferences are stored locally in your browser
- No analytics or tracking mechanisms are implemented

The extension's source code is open and available for review in our GitHub repository.

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
