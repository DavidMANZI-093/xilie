# Xilie Spotify

![Xilie Spotify Logo](icons/xilie-icon.png)

A powerful VS Code extension that brings seamless Spotify control right into your development environment. Control your music without ever leaving your code editor.

## Features

- **Playback Control**: Play, pause, skip tracks, and control volume directly from VS Code
- **Playlist Management**: Browse and select from your Spotify playlists
- **Now Playing**: See what's currently playing at a glance
- **Keyboard Shortcuts**: Control your music without touching your mouse
- **Status Bar Integration**: Quick access to player controls from the status bar
- **Dark Theme Support**: Beautiful UI that respects your VS Code theme

## Installation

1. Open VS Code
2. Go to Extensions view (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "Xilie Spotify"
4. Click Install
5. Reload VS Code when prompted

## Setup & Configuration

### Initial Setup
1. After installation, click on the Xilie icon in the activity bar
2. Click "Connect to Spotify" to authenticate
3. You'll be redirected to Spotify's authorization page in your browser
4. Click "Agree" to authorize Xilie to access your Spotify account
5. **VS Code**: You'll be redirected back to VS Code automatically
6. **Other VS Code variants** (Code-OSS, VSCodium, etc.): Copy the authorization code from the browser and paste it when prompted
7. You're all set! Start controlling your music

### Requirements
- **Spotify Premium account** (required for playback control)
- **Active Spotify session** on at least one device

### Troubleshooting

#### Authentication Issues
- **"Authentication Failed" or "Access Denied"**: The extension is in developer mode with limited access. Email [manzidavid093@gmail.com](mailto:manzidavid093@gmail.com) with your Spotify email to request access.
- **VS Code Variants**: If using Code-OSS, VSCodium, or other VS Code variants, you'll need to manually copy the authorization code from your browser when prompted
- If you're already approved and authentication fails, try signing out and signing in again
- Clear your browser cache and try authenticating again

#### Playback Issues  
- Make sure you have Spotify open on at least one device for playback controls to work
- Check that your Spotify Premium subscription is active
- Ensure you have an active internet connection

## Usage

- **Activity Bar**: Click the Xilie icon in the activity bar to open the main panel
- **Status Bar**: Click the play/pause icon in the status bar to control playback
- **Command Palette**: Use `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) and type "Xilie" to see available commands

## Requirements

- VS Code 1.99.0 or higher
- Active Spotify Premium account
- Node.js (for development)

## Beta Access Notice

⚠️ **Developer Mode Limitation**: This extension is currently in Spotify's developer mode, which means:
- Only users explicitly added to the approved list can authenticate
- If you encounter "Authentication Failed" or "Access Denied" errors, you need to be allowlisted
- This is a temporary limitation during the beta phase

**Need Access?** Email [manzidavid093@gmail.com](mailto:manzidavid093@gmail.com) with your Spotify email to be added to the approved users list. This limitation will be removed once the extension completes Spotify's app review process.

## Extension Settings

This extension contributes the following settings:

* `xilie.showStatusBarItem`: Show/hide the status bar control (default: true)
* `xilie.refreshInterval`: How often to refresh player state in milliseconds (default: 5000)
* `xilie.defaultVolume`: Default volume level (0-100, default: 50)

## Known Issues

- **Limited Beta Access**: Currently in Spotify developer mode - only pre-approved users can authenticate. Contact [manzidavid093@gmail.com](mailto:manzidavid093@gmail.com) for access.
- Playback controls may be slightly delayed due to Spotify API rate limiting
- Some features may require re-authentication after extended periods of inactivity
- Developer mode quota resets may require re-authentication

## Release Notes

### 0.0.6

Major improvements - Added Recent Tracks view, enhanced session management, improved error handling, and better empty state UX

### 0.0.5

Unified authentication experience - All IDEs now use consistent manual code input for reliable authentication

### 0.0.4

Critical authentication fix - Resolved hanging authentication issue in VS Code variants and IDEs like Kiro, Windsurf

### 0.0.3

Enhanced compatibility with VS Code variants - Added fallback authentication flow for Code-OSS, VSCodium, and other VS Code variants

### 0.0.2

Enhanced authentication security with PKCE-only OAuth 2.0 flow

### 0.0.1

Initial release of Xilie Spotify - Basic playback controls and playlist management

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Enjoy coding with your favorite tunes!** 🎧💻