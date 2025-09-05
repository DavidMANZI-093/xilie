// Configuration settings for the Xilie extension
/**
 * Application configuration settings.
 *
 * @property vars - Environment variable mappings.
 *
 */
export const SETTINGS = {
	vars: {
		/**
		 * Client ID for Spotify API.
		 * This is used to identify the application when making requests to the Spotify API.
		 * It should be set in the environment variable `CLIENT_ID`.
		 */
		CLIENT_ID: process.env.CLIENT_ID,
		/**
		 * Client Secret for Spotify API.
		 * This is used to authenticate the application when making requests to the Spotify API.
		 * It should be set in the environment variable `CLIENT_SECRET`.
		 */
		CLIENT_SECRET: process.env.CLIENT_SECRET,
		/**
		 * Spotify API Access Token.
		 * This token is used to authenticate requests to the Spotify API.
		 * It should be set in the environment variable `SPOTIFY_API_ACCESS_TOKEN`.
		 */
		SAAT: undefined,
		/**
		 * Spotify API Base URL.
		 * This is the base URL for the Spotify Web API.
		 * It is set to 'https://api.spotify.com'.
		 */
		SBU: process.env.SPOTIFY_BASE_URL,
		/**
		 * Redirect URI for Spotify API.
		 * This is the URI to which Spotify will redirect after authentication.
		 * It should be set in the environment variable `REDIRECT_URI`.
		 */
		REDIRECT_URI: process.env.REDIRECT_URI,
		/**
		 * Scopes for Spotify API.
		 * These are the permissions that the application is requesting from the user.
		 * They should be set in the environment variable `SPOTIFY_SCOPES`.
		 */
		SCOPES: [
			"user-read-private",
			"user-read-email",
			"user-top-read",
			"user-read-playback-state",
			"user-modify-playback-state",
			"user-read-currently-playing",
			"playlist-read-private",
			"playlist-read-collaborative",
			"streaming",
		],
	},
};
