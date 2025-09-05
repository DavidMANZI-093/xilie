# Change Log

All notable changes to the "xilie" extension will be documented in this file.

## [0.0.1] - 2024-12-19

### Added
- Initial release of Xilie Spotify extension
- Spotify authentication with OAuth 2.0 and PKCE
- Playback control (play, pause, next, previous)
- Playlist browsing and playback
- Artist browsing with top tracks
- Device selection and management
- Status bar integration showing current track
- Keyboard shortcuts for common actions
- Activity bar sidebar with playlists, artists, and devices

### Features
- **Authentication**: Secure OAuth 2.0 flow with PKCE
- **Playback Control**: Full control over Spotify playback
- **Playlist Management**: Browse and play your Spotify playlists
- **Artist Integration**: View followed artists and play their top tracks
- **Device Management**: Switch between available Spotify devices
- **Status Bar**: Real-time display of currently playing track
- **Keyboard Shortcuts**: Quick access to playback controls
- **Tree Views**: Organized sidebar views for easy navigation

### Technical
- TypeScript implementation with proper type safety
- Robust error handling and retry mechanisms
- Secure token storage using VS Code's SecretStorage API
- Configurable settings for refresh intervals and UI preferences