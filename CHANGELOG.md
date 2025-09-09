# Change Log

All notable changes to the "xilie" extension will be documented in this file.

## [0.0.4] - 2025-09-09

### Fixed
- **Critical Authentication Bug**: Resolved authentication hanging issue in fallback flow
- Fixed nested Promise creation that prevented authentication completion in VS Code variants
- Ensured browser opens correctly for IDEs without URI handler support (Kiro, Windsurf, etc.)
- Fixed authentication flow completion for all VS Code distributions

### Technical
- Removed redundant Promise wrapper in fallback authentication path
- Improved promise resolution handling in both URI handler and manual input flows
- Enhanced error handling and state management during authentication

## [0.0.3] - 2025-09-09

### Added
- **VS Code Variants Support**: Added fallback authentication flow for VS Code variants that don't support URI handlers
- Support for Code-OSS, VSCodium, and other VS Code distributions
- Manual authorization code input when automatic redirect isn't available

### Enhanced
- **Authentication Flow**: Improved authentication with dual redirect URI support
- Better error handling for authentication cancellation
- More robust authentication state management

### Technical
- Implemented redirect URI mapping system with browser and VS Code fallbacks
- Added `https://xilie-callback.vercel.app` as browser fallback redirect URI
- Enhanced authentication promise handling for better user experience

## [0.0.2] - 2025-09-06

### Security
- **Enhanced Authentication Security**: Migrated to PKCE-only OAuth 2.0 flow
- Removed client secret from authentication process for improved security
- Follows Spotify's recommended approach for public clients like VS Code extensions

### Technical
- Eliminated hardcoded client secret from codebase
- Simplified token exchange and refresh flows using PKCE verification only
- Updated authentication documentation to reflect security improvements

## [0.0.1] - 2025-09-05

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