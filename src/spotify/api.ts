import { SpotifyAuth } from "./auth";
import { logger } from "../utils/logger";
import {
	SpotifyPlaybackState,
	SpotifyPagingObject,
	SpotifyPlaylist,
	SpotifyUser,
} from "../types/spotify";

/**
 * Manages all interactions with the Spotify Web API.
 * It relies on SpotifyAuth to get valid access tokens.
 */
export class SpotifyApi {
	private readonly baseUrl = "https://api.spotify.com/v1";
	private spotifyAuth: SpotifyAuth;

	constructor(auth: SpotifyAuth) {
		this.spotifyAuth = auth;
	}

	/**
	 * Generic method for making authenticated requests to the Spotify Web API.
	 * Handles token retrieval and error responses.
	 * @param endpoint The API endpoint (e.g., '/me', '/me/playlists').
	 * @param method The HTTP method (GET, POST, PUT, DELETE).
	 * @param body Optional request body for POST/PUT requests.
	 * @returns The JSON response from the Spotify API.
	 */
	private async _fetch(
		endpoint: string,
		method: string = "GET",
		body?: any,
		retries: number = 3,
	): Promise<any> {
		const baseDelay = 500; // milliseconds

		for (let i = 0; i <= retries; i++) {
			try {
				const accessToken = await this.spotifyAuth.getAccessToken();

				const headers: Record<string, string> = {
					Authorization: `Bearer ${accessToken}`,
					"Content-Type": "application/json",
				};

				const requestOptions: RequestInit = {
					method: method,
					headers: headers,
				};

				if (body) {
					requestOptions.body = JSON.stringify(body);
				}

				const response = await fetch(
					`${this.baseUrl}${endpoint}`,
					requestOptions,
				);

				if (response.status === 401) {
					// Unauthorized - token might have become invalid
					if (i === 0) {
						logger.info("Access token expired, attempting refresh...");
						await this.spotifyAuth.getAccessToken();
						continue;
					}
					throw new Error(
						"Unauthorized Spotify API request. Re-authentication needed.",
					);
				}

				if (!response.ok) {
					// Handle specific error cases
					// if (response.status === 404) {
					// 	throw new Error(
					// 		"Spotify resource not found. The requested item may have been removed or is not available.",
					// 	);
					// }

					// if (response.status === 403) {
					// 	throw new Error(
					// 		"Access forbidden. You may not have the required Spotify Premium subscription or permissions.",
					// 	);
					// }

					if (response.status === 429) {
						const retryAfter = response.headers.get("Retry-After");
						const delay = retryAfter
							? parseInt(retryAfter) * 1000
							: baseDelay * Math.pow(2, i);
						if (i < retries) {
							logger.warn(`Rate limited. Retrying in ${delay}ms...`);
							await new Promise((resolve) => setTimeout(resolve, delay));
							continue;
						}
						throw new Error(
							"Spotify API rate limit exceeded. Please try again later.",
						);
					}

					// Check if this is a retryable error (e.g., 5xx)
					const isRetryable = response.status >= 500;

					if (isRetryable && i < retries) {
						const delay = baseDelay * Math.pow(2, i);
						logger.warn(
							`Spotify API request failed with status ${response.status}. Retrying in ${delay}ms...`,
						);
						await new Promise((resolve) => setTimeout(resolve, delay));
						continue;
					}

					// Non-retryable error or last attempt. Read body once and throw.
					const errorBody = await response.json().catch(() => response.text());
					throw new Error(
						`Spotify API request failed: ${response.statusText || response.status}. Details: ${JSON.stringify(errorBody)}`,
					);
				}

				// Handle special cases where no content is returned
				// e.g., pause, play, or player endpoints
				// These endpoints return 204 No Content or similar responses.
				if (
					response.status === 204 ||
					response.url.endsWith("/pause") ||
					response.url.endsWith("/play") ||
					response.url.endsWith("/next") ||
					response.url.endsWith("/previous")
				) {
					return {};
				}

				return await response.json();
			} catch (error: any) {
				if (error.message.includes("No active device found")) {
					throw new Error(error.message); // Do not retry if no active device
				} else {
					if (i < retries) {
						const delay = baseDelay * Math.pow(2, i);
						logger.warn(
							`Error in Spotify API _fetch: ${error.message}. Retrying in ${delay}ms...`,
						);
						await new Promise((resolve) => setTimeout(resolve, delay));
					} else {
						logger.error(
							`All retries failed. Error: ${error.message || error}`,
						);
					}
				}
			}
		}
	}

	/**
	 * Fetches the current user's profile information.
	 * @returns The user's profile object.
	 */
	public async getCurrentUserProfile(): Promise<SpotifyUser> {
		return this._fetch("/me");
	}

	/**
	 * Fetches a list of the current user's playlists.
	 * @param limit The maximum number of playlists to return.
	 * @param offset The index of the first playlist to return.
	 * @returns An object containing the playlists.
	 */
	public async getUserPlaylists(
		limit: number = 50,
		offset: number = 0,
	): Promise<SpotifyPagingObject<SpotifyPlaylist>> {
		let res = await this._fetch(
			`/me/playlists?limit=${limit}&offset=${offset}`,
		);

		// Safely handle pagination
		try {
			let next = res;
			while (next && next.next) {
				try {
					next = await this._fetch(next.next.slice(26));
					if (next && next.items) {
						res.items = [...res.items, ...next.items];
					} else {
						break;
					}
				} catch (error) {
					// Stop pagination if request fails
					break;
				}
			}
		} catch (error) {
			// If pagination fails entirely, just return what we have
			logger.warn("Pagination failed for playlists, returning partial results");
		}

		return res;
	}

	/**
	 * Fetches the tracks for a specific playlist.
	 * @param playlistId The ID of the playlist.
	 * @param limit The maximum number of tracks to return.
	 * @param offset The index of the first track to return.
	 * @returns An object containing the playlist tracks.
	 */
	public async getPlaylistTracks(
		playlistId: string,
		limit: number = 50,
		offset: number = 0,
	): Promise<any> {
		let res = await this._fetch(
			`/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`,
		);

		// Safely handle pagination
		try {
			let next = res;
			while (next && next.next) {
				try {
					next = await this._fetch(next.next.slice(26));
					if (next && next.items) {
						res.items = [...res.items, ...next.items];
					} else {
						break;
					}
				} catch (error) {
					// Stop pagination if request fails
					break;
				}
			}
		} catch (error) {
			// If pagination fails entirely, just return what we have
			logger.warn(
				"Pagination failed for playlist tracks, returning partial results",
			);
		}

		return res;
	}

	/**
	 * Fetches the recently played tracks for the current user.
	 * @returns An object containing the recently played tracks.
	 */
	public async getRecentTracks(limit: number = 50): Promise<any> {
		// Recently played endpoint uses cursor-based pagination, not offset
		const res = await this._fetch(`/me/player/recently-played?limit=${limit}`);

		// For recently played, we typically don't need to paginate through all results
		// as users usually only care about the most recent tracks
		return res;
	}

	/**
	 * Fetches the artists followed by the current user.
	 * @returns An object containing the followed artists.
	 */
	public async getFollowedArtists(
		limit: number = 50,
		offset: number = 0,
	): Promise<any> {
		const res = await this._fetch(`/me/following?type=artist&limit=${limit}`);

		// Safely handle pagination
		try {
			let next = res;
			while (next && next.next) {
				try {
					next = await this._fetch(next.next.slice(26));
					if (next && next.items) {
						res.items = [...res.items, ...next.items];
					} else {
						break;
					}
				} catch (error) {
					// Stop pagination if request fails
					break;
				}
			}
		} catch (error) {
			// If pagination fails entirely, just return what we have
			logger.warn(
				"Pagination failed for followed artists, returning partial results",
			);
		}

		return res;
	}

	/**
	 * Fetches the top tracks for a specific artist.
	 * @param artistId The ID of the artist.
	 * @returns An object containing the artist's top tracks.
	 */
	public async getArtistTopTracks(artistId: string): Promise<any> {
		// The country parameter is required for this endpoint.
		const response = await this._fetch(
			`/artists/${artistId}/top-tracks?country=US`,
		);
		return response.tracks;
	}

	/**
	 * Fetches details for a specific track.
	 * @param trackId The ID of the track.
	 */
	public async getTrack(trackId: string): Promise<any> {
		return this._fetch(`/tracks/${trackId}`);
	}

	/**
	 * Starts or resumes playback on the user's current device.
	 * @param deviceId Optional: The ID of the device to start playback on.
	 * @param contextUri Optional: Spotify URI for the context to play (e.g., album, playlist, artist).
	 * @param uris Optional: A list of track URIs to play.
	 */
	public async startPlayback(
		deviceId?: string,
		contextUri?: string,
		uris?: string[],
	): Promise<any> {
		const body: any = {};
		if (contextUri) {
			body.context_uri = contextUri;
		}
		if (uris) {
			body.uris = uris;
		}

		let endpoint = "/me/player/play";
		if (deviceId) {
			endpoint += `?device_id=${deviceId}`;
		}

		return this._fetch(endpoint, "PUT", body);
	}

	/**
	 * Pauses playback on the user's current device.
	 * @param deviceId Optional: The ID of the device to pause playback on.
	 */
	public async pausePlayback(deviceId?: string): Promise<any> {
		let endpoint = "/me/player/pause";
		if (deviceId) {
			endpoint += `?device_id=${deviceId}`;
		}
		return this._fetch(endpoint, "PUT");
	}

	/**
	 * Skips to the next track in the user's queue.
	 * @param deviceId Optional: The ID of the device to skip on.
	 */
	public async skipToNextTrack(deviceId?: string): Promise<any> {
		let endpoint = "/me/player/next";
		if (deviceId) {
			endpoint += `?device_id=${deviceId}`;
		}
		return this._fetch(endpoint, "POST");
	}

	/**
	 * Skips to the previous track in the user's queue.
	 * @param deviceId Optional: The ID of the device to skip on.
	 */
	public async skipToPreviousTrack(deviceId?: string): Promise<any> {
		let endpoint = "/me/player/previous";
		if (deviceId) {
			endpoint += `?device_id=${deviceId}`;
		}
		return this._fetch(endpoint, "POST");
	}

	/**
	 * Fetches information about the user's current playback state.
	 * @returns The current playback state object.
	 */
	public async getPlaybackState(): Promise<SpotifyPlaybackState | null> {
		try {
			return await this._fetch("/me/player");
		} catch (error: any) {
			if (error.message.includes("404")) {
				// No active device or playback
				return null;
			}
			throw error;
		}
	}

	/**
	 * Fetches a list of the user's available devices.
	 * @returns An object containing the available devices.
	 */
	public async getAvailableDevices(): Promise<any> {
		return this._fetch("/me/player/devices");
	}

	/**
	 * Transfers playback to a new device.
	 * @param deviceId The ID of the device to transfer playback to.
	 * @param play Optional: If true, playback will start on the new device.
	 */
	public async transferPlayback(
		deviceId: string,
		play: boolean = true,
	): Promise<any> {
		await this._fetch("/me/player", "PUT", {
			device_ids: [deviceId],
			play: play,
		});
	}

	/**
	 * Searches for items (tracks, artists, albums, playlists).
	 * @param query The search query.
	 * @param type A comma-separated list of item types to search across. Valid types are: album, artist, playlist, track.
	 * @param limit The maximum number of results to return.
	 * @param offset The index of the first result to return.
	 * @returns The search results.
	 */
	public async search(
		query: string,
		type: string = "track,artist,playlist",
		limit: number = 20,
		offset: number = 0,
	): Promise<any> {
		logger.debug(
			`Searching for ${query} (type: ${type}, limit: ${limit}, offset: ${offset})`,
		);
		const encodedQuery = encodeURIComponent(query);
		logger.debug(`Encoded query: ${encodedQuery}`);
		return this._fetch(
			`/search?q=${encodedQuery}&type=${type}&limit=${limit}&offset=${offset}`,
		);
	}
}
