import * as vscode from 'vscode';
import { SpotifyAuth } from "./auth";

/**
 * Manages all interactions with the Spotify Web API.
 * It relies on SpotifyAuth to get valid access tokens.
 */
export class SpotifyApi {
    private readonly baseUrl = 'https://api.spotify.com/v1';
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
    private async _fetch(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
        try {
            const accessToken = await this.spotifyAuth.getAccessToken();

            const headers: Record<string, string> = {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            };

            const requestOptions: RequestInit = {
                method: method,
                headers: headers,
            };

            if (body) {
                requestOptions.body = JSON.stringify(body);
            }

            const response = await fetch(`${this.baseUrl}${endpoint}`, requestOptions);

            if (response.status === 401) { // Unauthorized - token might have become invalid despite refresh attempt
                vscode.window.showErrorMessage('Xilie: Spotify token unauthorized. Please re-authenticate.');
                await this.spotifyAuth.clearTokens(); // Clear tokens to force re-authentication
                throw new Error('Unauthorized Spotify API request. Re-authentication needed.');
            }

            if (!response.ok) {
                const errorBody = await response.json().catch(() => response.text()); // Try to parse JSON, fall back to text
                console.error(`Spotify API Error (${response.status} ${response.statusText}):`, errorBody);
                throw new Error(`Spotify API request failed: ${response.statusText || response.status}. Details: ${JSON.stringify(errorBody)}`);
            }

            // Handle 204 No Content for PUT/DELETE operations that don't return a body
            if (response.status === 204) {
                return {}; // Return an empty object for no content responses
            }

            return await response.json();

        } catch (error: any) {
            console.error('Error in Spotify API _fetch:', error);
            throw new Error(`Failed to communicate with Spotify API: ${error.message || error}`);
        }
    }

    /**
     * Fetches the current user's profile information.
     * @returns The user's profile object.
     */
    public async getCurrentUserProfile(): Promise<any> {
        return this._fetch('/me');
    }

    /**
     * Fetches a list of the current user's playlists.
     * @param limit The maximum number of playlists to return.
     * @param offset The index of the first playlist to return.
     * @returns An object containing the playlists.
     */
    public async getUserPlaylists(limit: number = 50, offset: number = 0): Promise<any> {
        return this._fetch(`/me/playlists?limit=${limit}&offset=${offset}`);
    }

    /**
     * Fetches the tracks for a specific playlist.
     * @param playlistId The ID of the playlist.
     * @param limit The maximum number of tracks to return.
     * @param offset The index of the first track to return.
     * @returns An object containing the playlist tracks.
     */
    public async getPlaylistTracks(playlistId: string, limit: number = 50, offset: number = 0): Promise<any> {
        return this._fetch(`/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`);
    }

    /**
     * Starts or resumes playback on the user's current device.
     * @param deviceId Optional: The ID of the device to start playback on.
     * @param contextUri Optional: Spotify URI for the context to play (e.g., album, playlist, artist).
     * @param uris Optional: A list of track URIs to play.
     */
    public async startPlayback(deviceId: string, contextUri: string, uris?: string[]): Promise<any> {
        const body: any = {};
        if (contextUri) {
            body.context_uri = contextUri;
        }
        if (uris) {
            body.uris = uris;
        }

        let endpoint = '/me/player/play';
        if (deviceId) {
            endpoint += `?device_id=${deviceId}`;
        }

        return this._fetch(endpoint, 'PUT', body);
    }

    /**
     * Pauses playback on the user's current device.
     * @param deviceId Optional: The ID of the device to pause playback on.
     */
    public async pausePlayback(deviceId: string): Promise<any> {
        let endpoint = '/me/player/pause';
        if (deviceId) {
            endpoint += `?device_id=${deviceId}`;
        }
        return this._fetch(endpoint, 'PUT');
    }

    /**
     * Skips to the next track in the user's queue.
     * @param deviceId Optional: The ID of the device to skip on.
     */
    public async skipToNextTrack(deviceId: string): Promise<any> {
        let endpoint = '/me/player/next';
        if (deviceId) {
            endpoint += `?device_id=${deviceId}`;
        }
        return this._fetch(endpoint, 'POST');
    }

    /**
     * Skips to the previous track in the user's queue.
     * @param deviceId Optional: The ID of the device to skip on.
     */
    public async skipToPreviousTrack(deviceId: string): Promise<any> {
        let endpoint = '/me/player/previous';
        if (deviceId) {
            endpoint += `?device_id=${deviceId}`;
        }
        return this._fetch(endpoint, 'POST');
    }

    /**
     * Fetches information about the user's current playback state.
     * @returns The current playback state object.
     */
    public async getPlaybackState(): Promise<any> {
        return this._fetch('/me/player');
    }

    /**
     * Fetches a list of the user's available devices.
     * @returns An object containing the available devices.
     */
    public async getAvailableDevices(): Promise<any> {
        return this._fetch('/me/player/devices');
    }

    /**
     * Transfers playback to a new device.
     * @param deviceId The ID of the device to transfer playback to.
     * @param play Optional: If true, playback will start on the new device.
     */
    public async transferPlayback(deviceId: string, play: boolean = true): Promise<any> {
        await this._fetch('/me/player/transfer', 'PUT', { device_ids: [deviceId], play: play });
    }

    /**
     * Searches for items (tracks, artists, albums, playlists).
     * @param query The search query.
     * @param type A comma-separated list of item types to search across. Valid types are: album, artist, playlist, track.
     * @param limit The maximum number of results to return.
     * @param offset The index of the first result to return.
     * @returns The search results.
     */
    public async search(query: string, type: string = 'track', limit: number = 20, offset: number = 0): Promise<any> {
        const encodedQuery = encodeURIComponent(query);
        return this._fetch(`/search?q=${encodedQuery}&type=${type}&limit=${limit}&offset=${offset}`);
    }
}