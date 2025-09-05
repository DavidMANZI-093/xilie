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
5. You'll be redirected back to VS Code automatically
6. You're all set! Start controlling your music

### Requirements
- **Spotify Premium account** (required for playback control)
- **Active Spotify session** on at least one device

### Troubleshooting
- If authentication fails, try signing out and signing in again
- Make sure you have Spotify open on at least one device for playback controls to work
- Check that your Spotify Premium subscription is active

## Usage

- **Activity Bar**: Click the Xilie icon in the activity bar to open the main panel
- **Status Bar**: Click the play/pause icon in the status bar to control playback
- **Command Palette**: Use `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) and type "Xilie" to see available commands

## Requirements

- VS Code 1.99.0 or higher
- Active Spotify Premium account
- Node.js (for development)

## Extension Settings

This extension contributes the following settings:

* `xilie.showStatusBarItem`: Show/hide the status bar control (default: true)
* `xilie.refreshInterval`: How often to refresh player state in milliseconds (default: 5000)
* `xilie.defaultVolume`: Default volume level (0-100, default: 50)

## Known Issues

- Playback controls may be slightly delayed due to Spotify API rate limiting
- Some features may require re-authentication after extended periods of inactivity

## Release Notes

### 0.0.1

Initial release of Xilie Spotify - Basic playback controls and playlist management

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Enjoy coding with your favorite tunes!** 🎧💻