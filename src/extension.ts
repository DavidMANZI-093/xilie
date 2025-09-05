import * as vscode from "vscode";
import { SpotifyAuth } from "./spotify/auth";
import { SpotifyApi } from "./spotify/api";
import { SpotifySidebarProvider } from "./ui/sidebar";
import { SpotifyStatusBar } from "./ui/statusbar";
import { logger } from "./utils/logger";
import { SpotifyTrack } from "./types";

// Global instances (initialized in activate)
let spotifyAuth: SpotifyAuth;
let spotifyApi: SpotifyApi;
let statusBar: SpotifyStatusBar;
let sidebarViews: { [key: string]: SpotifySidebarProvider };

export function activate(context: vscode.ExtensionContext) {
	logger.info('Xilie is now active!');

	spotifyAuth = new SpotifyAuth(
		context.secrets,
		"vscode://d3fault.xilie/auth/callback",
	);
	spotifyApi = new SpotifyApi(spotifyAuth);

	statusBar = new SpotifyStatusBar(spotifyApi);
	
	// Check if status bar should be shown based on settings
	const initialConfig = vscode.workspace.getConfiguration('xilie');
	const showStatusBar = initialConfig.get<boolean>('showStatusBarItem', true);
	if (!showStatusBar) {
		statusBar.hide();
	}
	
	sidebarViews = {
		"playlists": new SpotifySidebarProvider(spotifyApi, "xiliePlaylists"),
		"artists": new SpotifySidebarProvider(spotifyApi, "xilieArtists"),
		"devices": new SpotifySidebarProvider(spotifyApi, "xilieDevices"),
	};

	// Commands registry
	context.subscriptions.push( // Authentication command
		vscode.commands.registerCommand("xilie.authenticate", async () => {
			try {
				await spotifyAuth.authenticate();
				
				const authTimeout = setTimeout(async () => {
					if (!await spotifyAuth.isAuthenticated()) {
						await spotifyAuth.cancelAuthentication();
						updateUIStatus();
					}
				}, 60 * 1000);
				
				clearTimeout(authTimeout);
				updateUIStatus();
			} catch (error: any) {
				if (error.message.includes("access_denied")) {
					vscode.window.showErrorMessage("Spotify authentication was cancelled.", "Close").then((choice) => {
						if (choice === "Close") {
							spotifyAuth.cancelAuthentication();
						}
					});
				} else {
					vscode.window.showErrorMessage(
						`Spotify authentication failed: ${error.message || error}`,
						"Close",
					).then((choice) => {
						if (choice === "Close") {
							spotifyAuth.cancelAuthentication();
						}
					});
				}
				logger.error(`Authentication error: ${error}`);
				updateUIStatus();
			}
		}),
	);

	context.subscriptions.push( // Show Xilie sidebar view
		vscode.commands.registerCommand("xilie.showXilie", async () => {
			try {
				vscode.commands.executeCommand("workbench.view.extension.xilie-explorer");
			} catch (error) {
				logger.error(`Error showing Xilie view: ${error}`);
				vscode.window.showErrorMessage(
					`Failed to show Xilie view: ${error}`,
					"Close",
				);
			}
		})
	);

	context.subscriptions.push( // Sign out command
		vscode.commands.registerCommand("xilie.signOut", async () => {
			try {
				await spotifyAuth.clearTokens();
				updateUIStatus();
			} catch (error: any) {
				vscode.window.showErrorMessage(
					`Spotify sign-out failed: ${error.message || error}`,
					"Close",
				);
			}
		}),
	);

	context.subscriptions.push( // Play/pause command
		vscode.commands.registerCommand("xilie.playPause", async () => {
			try {
				const playbackState = await spotifyApi.getPlaybackState();
				logger.debug(`Current playback state: ${playbackState}`);
				if (playbackState && playbackState.is_playing) {
					if (playbackState.device?.id) {
						await spotifyApi.pausePlayback(playbackState.device.id);
					} else {
						await spotifyApi.pausePlayback();
					}
					vscode.window.showInformationMessage("Spotify playback paused.");
				} else {
					await spotifyApi.startPlayback();
					vscode.window.showInformationMessage(
						"Spotify playback started/resumed.",
					);
				}
				updatePlaybackStatusBar();
			} catch (error: any) {
				if (error.message.includes("No active device")) {
					vscode.window.showErrorMessage(
						"No active Spotify device found. Please open Spotify on one of your devices and try again.",
						"Open Spotify Web Player"
					).then((selection) => {
						if (selection === "Open Spotify Web Player") {
							vscode.env.openExternal(vscode.Uri.parse("https://open.spotify.com"));
						}
					});
				} else if (error.message.includes("Premium")) {
					vscode.window.showErrorMessage(
						"Spotify Premium is required for playback control. Please upgrade your account.",
						"Learn More"
					).then((selection) => {
						if (selection === "Learn More") {
							vscode.env.openExternal(vscode.Uri.parse("https://www.spotify.com/premium/"));
						}
					});
				} else {
					vscode.window.showErrorMessage(
						`Failed to control playback: ${error.message || error}`,
					);
				}
				logger.error(`Playback control error: ${error}`);
			}
		}),
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(
			"xilie.selectDevice",
			async (device: { id: string; name: string }) => {
				try {
					await spotifyApi.transferPlayback(device.id);
					vscode.window.showInformationMessage(
						`Playback transferred to device: ${device.name}`,
						"Close",
					);
				} catch (error: any) {
					vscode.window.showErrorMessage(
						`Could to transfer playback to device: ${error.message}`,
					);
					logger.error(`Playback transfer error: ${error.message}`);
				}
			},
		),
	);

	context.subscriptions.push(
		vscode.commands.registerCommand("xilie.nextTrack", async () => {
			try {
				await spotifyApi.skipToNextTrack();
				vscode.window.showInformationMessage("Skipped to next track.");
				updatePlaybackStatusBar(); // Update status bar immediately after action
			} catch (error: any) {
				vscode.window.showErrorMessage(
					`Failed to skip track: ${error.message}`,
				);
				logger.error(`Skip track error: ${error.message}`);
			}
		}),
	);

	context.subscriptions.push(
		vscode.commands.registerCommand("xilie.previousTrack", async () => {
			try {
				await spotifyApi.skipToPreviousTrack();
				vscode.window.showInformationMessage("Skipped to previous track.");
				updatePlaybackStatusBar(); // Update status bar immediately after action
			} catch (error: any) {
				vscode.window.showErrorMessage(
					`Failed to skip track: ${error.message}`,
				);
				logger.error(`Skip track error: ${error.message}`);
			}
		}),
	);

	// Playback commands for tree items (playlists, albums, tracks)
	context.subscriptions.push(
		vscode.commands.registerCommand(
			"xilie.playPlaylist",
			async (playlist: { uri: string; name: string }) => {
				try {
					await spotifyApi.startPlayback(undefined, playlist.uri); // Start playback of the playlist
					vscode.window.showInformationMessage(
						`Playing playlist: ${playlist.name}`,
					);
					updatePlaybackStatusBar(); // Update status bar immediately after action
				} catch (error: any) {
					vscode.window.showErrorMessage(
						`Failed to play playlist: ${error.message || error}`,
					);
					logger.error(`Play playlist error: ${error}`);
				}
			},
		),
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(
			"xilie.playArtistTopTracks",
			async (artist: { uri: string; name: string }) => {
				try {
					await spotifyApi.startPlayback(undefined, artist.uri);
					vscode.window.showInformationMessage(
						`Playing top tracks for artist: ${artist.name}`,
					);
					updatePlaybackStatusBar();
				} catch (error: any) {
					if (error.message.includes("No active device found")) {
						vscode.window.showInformationMessage(
							"No active Spotify device found. Open Spotify on one of your devices and try again.",
						);
					} else {
						vscode.window.showErrorMessage(
							`Failed to play artist's top tracks: ${error.message || error}`,
						);
					}
					logger.error(`Play artist top tracks error: ${error}`);
				}
			},
		),
	);

	context.subscriptions.push(
		vscode.commands.registerCommand("xilie.playAlbum", async (uri: string) => {
			try {
				await spotifyApi.startPlayback(undefined, uri); // Start playback of the album
				vscode.window.showInformationMessage(`Playing album: ${uri}`);
				updatePlaybackStatusBar(); // Update status bar immediately after action
			} catch (error: any) {
				vscode.window.showErrorMessage(
					`Failed to play album: ${error.message || error}`,
				);
				logger.error(`Play album error: ${error}`);
			}
		}),
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(
			"xilie.playTrack",
			async (track: { name: string; artists: string; uri: string }) => {
				try {
					await spotifyApi.startPlayback(undefined, undefined, [track.uri]); // Start playback of the specific track
					vscode.window.showInformationMessage(
						`Playing track: ${track.name} - ${track.artists}`,
					);
					updatePlaybackStatusBar(); // Update status bar immediately after action
				} catch (error: any) {
					vscode.window.showErrorMessage(
						`Failed to play track: ${error.message || error}`,
					);
					logger.error(`Play track error: ${error.message}`);
				}
			},
		),
	);

	context.subscriptions.push(
		vscode.commands.registerCommand("xilie.collapsePlaylists", () => {
			// This command programmatically executes a built-in VS Code command
			vscode.commands.executeCommand(
				"workbench.actions.treeView.xiliePlaylists.collapseAll",
			);
		}),
	);

	context.subscriptions.push(
		vscode.commands.registerCommand("xilie.collapseArtists", () => {
			// This command programmatically executes a built-in VS Code command
			vscode.commands.executeCommand(
				"workbench.actions.treeView.xilieArtists.collapseAll",
			);
		}),
	);

	context.subscriptions.push(
		vscode.commands.registerCommand("xilie.refreshPlaylists", () => {
			sidebarViews["playlists"].refresh();
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand("xilie.refreshArtists", () => {
			sidebarViews["artists"].refresh();
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand("xilie.refreshDevices", () => {
			sidebarViews["devices"].refresh();
		})
	);

	// --- Register UI Components ---
	vscode.window.registerTreeDataProvider(
		"xiliePlaylists",
		sidebarViews["playlists"],
	);
	vscode.window.registerTreeDataProvider(
		"xilieDevices",
		sidebarViews["devices"],
	);
	vscode.window.registerTreeDataProvider(
		"xilieArtists",
		sidebarViews["artists"],
	);

	context.subscriptions.push(statusBar.statusBarItem);
	
	// --- Initial UI Update and Periodic Refresh ---
	updateUIStatus();
	
	// Get refresh interval from settings
	const extensionConfig = vscode.workspace.getConfiguration('xilie');
	const refreshInterval = extensionConfig.get<number>('refreshInterval', 5000);
	
	setInterval(updateUIStatus, 60 * 1000); // Refresh every minute
	let playbackInterval = setInterval(updatePlaybackStatusBar, refreshInterval); // Update playback status based on settings

	// Listen for configuration changes
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration((e) => {
			if (e.affectsConfiguration('xilie')) {
				const updatedConfig = vscode.workspace.getConfiguration('xilie');
				
				// Update status bar visibility
				const showStatusBar = updatedConfig.get<boolean>('showStatusBarItem', true);
				if (showStatusBar) {
					statusBar.show();
				} else {
					statusBar.hide();
				}
				
				// Update refresh interval
				const newRefreshInterval = updatedConfig.get<number>('refreshInterval', 5000);
				if (newRefreshInterval !== refreshInterval) {
					clearInterval(playbackInterval);
					playbackInterval = setInterval(updatePlaybackStatusBar, newRefreshInterval);
				}
			}
		})
	);

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
}

// This method is called when your extension is deactivated
export function deactivate() {
	spotifyAuth.clearTokens();
}

async function updateUIStatus() {
	
	Object.values(sidebarViews).forEach((provider) => provider.refresh());
}

async function updatePlaybackStatusBar() {
	try {
		const isAuthenticated = await spotifyAuth.isAuthenticated();
		if (!isAuthenticated) {
			statusBar.showUnauthenticated();
			return;
		}

		const playbackState = await spotifyApi.getPlaybackState();
		if (
			playbackState &&
			(playbackState.is_playing || playbackState.item.name)
		) {
			const trackName = playbackState.item.name;
			const artistName = playbackState.item.artists
				.map((artist: any) => artist.name)
				.join(", ");
			statusBar.updatePlaybackStatus(
				trackName,
				artistName,
				playbackState.is_playing,
			);
		} else {
			statusBar.showAuthenticated();
		}
	} catch (error: any) {
		// Log err but avoid showing frequent messages to the user for periodic updates
		logger.error(`Error updating status bar: ${error}`);
		// Fallback to "Ready" state if there's an API error during status bar update
		statusBar.showAuthenticated();
	}
}
