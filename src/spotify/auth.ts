import * as vscode from "vscode";
import crypto from "crypto";

/**
 * Manages Spotify OAuth 2.0 Authorization flow with PKCE.
 * Handles authentication, token storage, and token refreshing.
 */
export class SpotifyAuth {
	private static readonly ACCESS_TOKEN_KEY = "spotifyAccessToken";
	private static readonly REFRESH_TOKEN_KEY = "spotifyRefreshToken";
	private static readonly TOKEN_EXPIRY_KEY = "spotifyTokenExpiry";

	private readonly CLIENT_ID = "b61c64d6e5574e379e31dce5002d845c";
	private readonly CLIENT_SECRET = "54267a4f7c0f487e9e382eba3d8bb0b7";

	private readonly REDIRECT_URI: string;
	private readonly secrets: vscode.SecretStorage;

	// Internal state for the current authentication attempt
	private _currentAuthPromise: Promise<string> | undefined;
	private _uriHandlerDisposable: vscode.Disposable | undefined;

	constructor(secretStorage: vscode.SecretStorage, redirectUri: string) {
		this.secrets = secretStorage;
		this.REDIRECT_URI = redirectUri;
	}

	public async authenticate(): Promise<string> {
		// Prevent multiple authentication attempts simultaniously
		if (this._currentAuthPromise) {
			vscode.window.showInformationMessage(
				"Authentication already in progress.",
			);
			return this._currentAuthPromise;
		}

		this._currentAuthPromise = new Promise(async (resolve, reject) => {
			try {
				// 1. Generate PKCE code_verifier and code _challenge
				const codeVerifier = this.generateRandomString(128);
				const codeChallenge = await this.generateCodeChallenge(codeVerifier);

				// Store the code_verifier securely for later use in the token exchange
				await this.secrets.store("xilie.pkce.codeVerifier", codeVerifier);

				// 2. Construct the Spotify authorization URL
				const authUrl = new URL("https://accounts.spotify.com/authorize");
				authUrl.searchParams.append("client_id", this.CLIENT_ID);
				authUrl.searchParams.append("response_type", "code");
				authUrl.searchParams.append("redirect_uri", this.REDIRECT_URI);
				authUrl.searchParams.append(
					"scope",
					"user-read-private user-read-email user-read-playback-state user-modify-playback-state user-read-currently-playing playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private user-library-read user-library-modify user-top-read user-read-recently-played",
				); // Request necessary scopes
				authUrl.searchParams.append("code_challenge_method", "S256");
				authUrl.searchParams.append("code_challenge", codeChallenge);
				authUrl.searchParams.append("state", this.generateRandomString(16)); // Optional state parameter for CSRF protection

				// 3. Register a URI handler to capture the redirect from Spotify
				// This handler will be called when the browser redirects back to extension's URI
				this._uriHandlerDisposable = vscode.window.registerUriHandler({
					handleUri: async (uri: vscode.Uri) => {
						this._uriHandlerDisposable?.dispose(); // Dispose handler after first use
						this._uriHandlerDisposable = undefined;

						// Parse the query string from the redirect URI
						const params = new URLSearchParams(uri.query);

						const code = params.get("code");
						const error = params.get("error");

						if (error) {
							reject(new Error(`Spotify authorization error: ${error}`));
							return;
						}
						if (!code) {
							reject(new Error("No authorization code received from Spotify."));
							return;
						}

						// 4. Exchange the authorization code for an access token
						try {
							const accessToken = await this.exchangeCodeForToken(code);
							resolve(accessToken);
						} catch (tokenError: any) {
							reject(
								new Error(
									`Failed to exchange code for token: ${tokenError.message || tokenError}`,
								),
							);
						} finally {
							this._currentAuthPromise = undefined; // Reset the promise
						}
					},
				});

				// 5. Open the authentication URL in the user's default browser
				await vscode.env.openExternal(vscode.Uri.parse(authUrl.toString()));
			} catch (error: any) {
				this._uriHandlerDisposable?.dispose();
				this._uriHandlerDisposable = undefined;
				this._currentAuthPromise = undefined;
				reject(
					new Error(
						`Authentication initiation failed: ${error.message || error}`,
					),
				);
			}
		});

		return this._currentAuthPromise;
	}

	/**
	 * Genrates a cryptographically secure random string.
	 * Used for PKCE code_verifier and Oauth state parameter.
	 * @param length The desired length of the random string.
	 */
	private generateRandomString(length: number): string {
		const possible =
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		const randomBytes = crypto.randomBytes(length);
		return Array.from(randomBytes)
			.map((x) => possible[x % possible.length])
			.join("");
	}

	/**
	 * Generates the PKCE code_challenge from the code_verifier.
	 * @param codeVerifier The PKCE code_verifier.
	 */
	private async generateCodeChallenge(codeVerifier: string): Promise<string> {
		const sha256 = crypto.createHash("sha256");
		sha256.update(codeVerifier);
		return sha256
			.digest("base64")
			.replace(/\+/g, "-")
			.replace(/\//g, "_")
			.replace(/=+$/, "");
	}

	/**
	 * Exchanges the authorization code for an access token using PKCE.
	 * This is a server-to-server (or extension-host-to-server) request.
	 * @param code The authorization code received from Spotify.
	 * @returns The access token.
	 */
	private async exchangeCodeForToken(code: string): Promise<string> {
		const tokenEndpoint = "https://accounts.spotify.com/api/token";
		const codeVerifier = await this.secrets.get("xilie.pkce.codeVerifier");

		if (!codeVerifier) {
			throw new Error(
				"PKCE code_verifier not found. Authentication flow interrupted.",
			);
		}

		const params = new URLSearchParams();
		params.append("client_id", this.CLIENT_ID);
		params.append("grant_type", "authorization_code");
		params.append("code", code);
		params.append("redirect_uri", this.REDIRECT_URI);
		params.append("code_verifier", codeVerifier);

		// For a VS Code extension, we can include the client_secret here
		// as the request is made from the secure extension host, not the browser.
		// This makes it behave like a "confidential client" for the token exchange.
		const authHeader = `Basic ${Buffer.from(`${this.CLIENT_ID}:${this.CLIENT_SECRET}`).toString("base64")}`;

		const response = await fetch(tokenEndpoint, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				Authorization: authHeader,
			},
			body: params.toString(),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`Spotify token exchange failed: ${response.status} - ${errorText}`,
			);
		}

		const tokenResponse = (await response.json()) as {
			access_token: string;
			refresh_token: string;
			expires_in: number;
			[key: string]: any;
		};

		// Store tokens securely
		await this.secrets.store(
			SpotifyAuth.ACCESS_TOKEN_KEY,
			tokenResponse.access_token,
		);
		await this.secrets.store(
			SpotifyAuth.REFRESH_TOKEN_KEY,
			tokenResponse.refresh_token,
		);
		// Store expiry time (current time + expires_in seconds)
		await this.secrets.store(
			SpotifyAuth.TOKEN_EXPIRY_KEY,
			(Date.now() + tokenResponse.expires_in * 1000).toString(),
		);

		return tokenResponse.access_token;
	}

	public async getAccessToken(): Promise<string> {
		let accessToken = await this.secrets.get(SpotifyAuth.ACCESS_TOKEN_KEY);
		const refreshToken = await this.secrets.get(SpotifyAuth.REFRESH_TOKEN_KEY);
		const expiryTimeStr = await this.secrets.get(SpotifyAuth.TOKEN_EXPIRY_KEY);
		const expiryTime = expiryTimeStr ? parseInt(expiryTimeStr, 10) : 0;

		// Check if token is missing or expired (with a small buffer)
		if (!accessToken || !refreshToken || Date.now() >= expiryTime - 60 * 1000) {
			// Refresh 1 minute before actual expiry
			vscode.window.showInformationMessage(
				`Xilie: Refreshing Spotify access token...`,
			);
			try {
				accessToken = await this.refreshAccessToken(refreshToken!);
				vscode.window.showInformationMessage(
					`Xilie: Spotify access token refreshed.`,
				);
			} catch (error: any) {
				vscode.window.showErrorMessage(
					`Xilie: Failed to refresh Spotify token. Please re-authenticate`,
				);
				// Clear invalid tokens
				await this.clearTokens();
				throw new Error(
					"No valid Spotify access token or refresh token. Please authenticate.",
				);
			}
		}
		if (!accessToken) {
			throw new Error("Failed to obtain Spotify access token.");
		}
		return accessToken;
	}

	/**
	 * Refreshes the Spotify access token using the refresh token.
	 * @param refreshToken The refresh token.
	 * @returns The new access token.
	 */
	private async refreshAccessToken(refreshToken: string): Promise<string> {
		const tokenEndpoint = "https://accounts.spotify.com/api/token";
		const params = new URLSearchParams();
		params.append("grant_type", "refresh_token");
		params.append("refresh_token", refreshToken);
		params.append("client_id", this.CLIENT_ID); // Client ID is required for refresh token grant

		const authHeader = `Basic ${Buffer.from(`${this.CLIENT_ID}:${this.CLIENT_SECRET}`).toString("base64")}`;

		const response = await fetch(tokenEndpoint, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				Authorization: authHeader,
			},
			body: params.toString(),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`Spotify token refresh failed: ${response.status} - ${errorText}`,
			);
		}

		const tokenResponse = (await response.json()) as {
			access_token: string;
			refresh_token: string;
			expires_in: number;
			[key: string]: any;
		};

		// Store new tokens securely
		await this.secrets.store(
			SpotifyAuth.ACCESS_TOKEN_KEY,
			tokenResponse.access_token,
		);
		// A new refresh token might be provided, or the old one might remain valid.
		// Always store the new one if provided.
		if (tokenResponse.refresh_token) {
			await this.secrets.store(
				SpotifyAuth.REFRESH_TOKEN_KEY,
				tokenResponse.refresh_token,
			);
		}
		await this.secrets.store(
			SpotifyAuth.TOKEN_EXPIRY_KEY,
			(Date.now() + tokenResponse.expires_in * 1000).toString(),
		);

		return tokenResponse.access_token;
	}

	/**
	 * Checks if the user us currently authenticated (has an access token).
	 */
	public async isAuthenticated(): Promise<boolean> {
		try {
			await this.getAccessToken(); // Attemp to get/refresh token
			return true;
		} catch (error) {
			return false;
		}
	}

	public async cancelAuthentication(): Promise<void> {
		this._currentAuthPromise = undefined; // Clear the current auth promise
		if (this._uriHandlerDisposable) {
			this._uriHandlerDisposable.dispose();
			this._uriHandlerDisposable = undefined;
			await this.clearTokens(); // Clear any stored tokens
			vscode.window.showInformationMessage("Spotify authentication cancelled.");
		} else {
			vscode.window.showInformationMessage("No authentication in progress.");
		}
	}

	/**
	 * Clears all stored Spotify authentication tokens.
	 */
	public async clearTokens(): Promise<void> {
		await this.secrets.delete(SpotifyAuth.ACCESS_TOKEN_KEY);
		await this.secrets.delete(SpotifyAuth.REFRESH_TOKEN_KEY);
		await this.secrets.delete(SpotifyAuth.TOKEN_EXPIRY_KEY);
		// vscode.window.showInformationMessage(
		// 	`Xilie: Spotify tokens cleared. Please re-authenticate.`,
		// );
	}
}
