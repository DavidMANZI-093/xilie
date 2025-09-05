import * as vscode from "vscode";
import { SpotifyApi } from "../spotify/api";
export class SpotifyStatusBar {
	private spotifyApi: SpotifyApi;
	public statusBarItem: vscode.StatusBarItem;

	constructor(api: SpotifyApi) {
		// Create a new status bar item at the right side, iwth high priority
		this.statusBarItem = vscode.window.createStatusBarItem(
			vscode.StatusBarAlignment.Right,
			100,
		);

		this.spotifyApi = api;
		this.statusBarItem.name = "Xilie Spotify Controller";
		this.statusBarItem.tooltip = "Xilie Spotify Controller";
		this.statusBarItem.show(); // Show it by default
		this.showUnauthenticated(); // Set initial state
	}

	/**
	 * Updates the status bar to show an unauthenticated state.
	 */
	public showUnauthenticated(): void {
		this.statusBarItem.text = "$(lock-small) Xilie: Sign in";
		this.statusBarItem.command = "xilie.authenticate"; // Command to trigger authentication
		this.statusBarItem.tooltip = "Click to sign in with Spotify";
	}

	/**
	 * Updates the status bar to show an authenticated state (no playback info yet).
	 */
	public async showAuthenticated(): Promise<void> {
		const user = await this.spotifyApi.getCurrentUserProfile();
		this.statusBarItem.text = "$(check-all) Xilie: Ready";
		this.statusBarItem.command = undefined; // No command when authenticated
		this.statusBarItem.tooltip =
			user && user.display_name
				? `Signed in as ${user.display_name}`
				: "Signed in to Spotify";
	}

	/**
	 * Updates the status bar with current playback information.
	 * @param trackName The name of the current track.
	 * @param artistName The name of the artist(s).
	 * @param isPlaying Whether the track is currently playing.
	 */
	public updatePlaybackStatus(
		trackName: string,
		artistName: string,
		isPlaying: boolean,
	): void {
		const playPauseIcon = isPlaying ? "$(debug-pause)" : "$(play)";
		this.statusBarItem.text = `${playPauseIcon} ${trackName} - ${artistName}`;
		this.statusBarItem.tooltip = `Currently Playing: ${trackName} by ${artistName}\nClick to Play/Pause`;
		this.statusBarItem.command = "xilie.playPause"; // Command to toggle play/pause
	}

	/**
	 * Shows the status bar item.
	 */
	public show(): void {
		this.statusBarItem.show();
	}

	/**
	 * Hides the status bar item.
	 */
	public hide(): void {
		this.statusBarItem.hide();
	}

	/**
	 * Disposes the status bar item when the extension is deactivated.
	 */
	public dispose(): void {
		this.statusBarItem.dispose();
	}
}