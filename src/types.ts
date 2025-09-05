import * as vscode from "vscode";
import { SpotifyPlaylist as SpotifyPlaylistAPI, SpotifyArtist as SpotifyArtistAPI, SpotifyTrack as SpotifyTrackAPI, SpotifyAlbum as SpotifyAlbumAPI, SpotifyDevice as SpotifyDeviceAPI } from "./types/spotify";

/**
 * Common interface for Spotify items that can be displayed in the tree view.
 */
export interface SpotifyTreeItem {
	id: string;
	name: string;
	uri: string; // Spotify URI (e.g., spotify:playlist:...)
	type: "playlist" | "album" | "track" | "artist" | "device";
	// Add other common properties if needed
}

/**
 * Interface for a Spotify Device object (can be used for playback)
 */
export interface SpotifyDevice extends SpotifyTreeItem {
	type: "device";
	isActive: boolean;
	isRestricted: boolean;
	deviceType: "Computer" | "Smartphone" | "Speaker" | "TV" | "Tablet" | "Other";
	// Add other device-specific properties if needed
}

/**
 * Interface for a Spotify Playlist object (simplified for tree view).
 */
export interface SpotifyPlaylist extends SpotifyTreeItem {
	type: "playlist";
	description?: string;
	ownerName?: string;
	tracksTotal?: number;
	images?: Array<{ url: string; height: number; width: number }>;
}

export interface SpotifyArtist extends SpotifyTreeItem {
	type: "artist";
	images?: Array<{ url: string; height: number; width: number }>;
}

/**
 * Interface for a Spotify Album object (simplified for tree view).
 */
export interface SpotifyAlbum extends SpotifyTreeItem {
	type: "album";
	artists?: Array<{ name: string }>;
	releaseDate?: string;
	images?: Array<{ url: string; height: number; width: number }>;
}

/**
 * Interface for a Spotify Track object (simplified for tree view).
 */
export interface SpotifyTrack extends SpotifyTreeItem {
	type: "track";
	artists?: Array<{ name: string }>;
	albumName?: string;
	durationMs: number;
	isPlayable: boolean;
	// Add other track-specific properties if needed
}

export class SpotifyTreeItem extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly spotifyId: string,
		public readonly spotifyUri: string,
		public readonly spotifyType:
			| "playlist"
			| "album"
			| "track"
			| "artist"
			| "device",
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command,
		public readonly iconPath?:
			| string
			| vscode.Uri
			| { light: vscode.Uri; dark: vscode.Uri }
			| vscode.ThemeIcon,
	) {
		super(label, collapsibleState);
		this.id = spotifyId; // Use Spotify ID as the tree item ID for uniqueness
		this.tooltip = this.label; // Tooltip on hover
		this.resourceUri = vscode.Uri.parse(spotifyUri); // Associate with Spotify URI
		this.contextValue = spotifyType; // Context value for 'when' clauses in package.json
	}

	// Helper to create a TreeItem from a SpotifyPlaylist
	static fromPlaylist(playlist: SpotifyPlaylist): SpotifyTreeItem {
		return new SpotifyTreeItem(
			playlist.name,
			playlist.id,
			playlist.uri,
			"playlist",
			vscode.TreeItemCollapsibleState.Collapsed, // Playlists can be expanded to show tracks
			{
				command: "xilie.playPlaylist", // Command to play the playlist
				title: "Play Playlist",
				arguments: [{ uri: playlist.uri, name: playlist.name }], // Pass playlist URI and name as arguments
			},
			new vscode.ThemeIcon("folder-library"), // Generic list icon for playlists
		);
	}

	// Helper to create a TreeItem from a SpotifyDevice
	static fromDevice(device: SpotifyDevice): SpotifyTreeItem {
		return new SpotifyTreeItem(
			device.name,
			device.id,
			`spotify:device:${device.id}`, // Custom URI format for devices
			"device", // Using 'artist' type for devices, can be customized
			vscode.TreeItemCollapsibleState.None, // Devices are leaf nodes
			{
				command: "xilie.selectDevice", // Command to select this device for playback
				title: "Select Device",
				arguments: [{ id: device.id, name: device.name }], // Pass device ID as argument
			},
			new vscode.ThemeIcon(
				device.deviceType === "Smartphone" ? "device-mobile" : "device-desktop",
			), // TODO: Use different icons based on device type
		);
	}

	// Helper to create a TreeItem from a SpotifyArtist
	static fromArtist(artist: SpotifyArtist): SpotifyTreeItem {
		return new SpotifyTreeItem(
			artist.name,
			artist.id,
			artist.uri,
			"artist",
			vscode.TreeItemCollapsibleState.Collapsed, // Artists can be expanded to show tracks
			{
				command: "xilie.playArtistTopTracks", // New command to play top tracks
				title: "Play Artist's Top Tracks",
				arguments: [{ uri: artist.uri, name: artist.name }], // Pass artist ID as an argument
			},
			new vscode.ThemeIcon("person"), // Use the mic icon for artists
		);
	}

	// Helper to create a TreeItem from a SpotifyAlbum
	static fromAlbum(album: SpotifyAlbum): SpotifyTreeItem {
		return new SpotifyTreeItem(
			album.name +
				(album.artists
					? ` - ${album.artists.map((a) => a.name).join(", ")}`
					: ""),
			album.id,
			album.uri,
			"album",
			vscode.TreeItemCollapsibleState.Collapsed, // Albums can be expanded to show tracks
			{
				command: "xilie.playAlbum", // Command to play the album
				title: "Play Album",
				arguments: [album.uri],
			},
			new vscode.ThemeIcon("library"), // Generic album icon
		);
	}

	// Helper to create a TreeItem from a SpotifyTrack
	static fromTrack(track: SpotifyTrack): SpotifyTreeItem {
		const artists = track.artists
			? track.artists.map((a) => a.name).join(", ")
			: "Unknown Artist";
		const label = `${track.name} - ${artists}`;
		return new SpotifyTreeItem(
			label,
			track.id,
			track.uri,
			"track",
			vscode.TreeItemCollapsibleState.None, // Tracks are leaf nodes
			{
				command: "xilie.playTrack", // Command to play this specific track
				title: "Play Track",
				arguments: [
					{
						name: track.name,
						artists: track.artists
							? track.artists.map((a) => a.name).join(", ")
							: "Unknown Artist",
						uri: track.uri,
					},
				], // Pass track name and URI as arguments
			},
			new vscode.ThemeIcon("play"), // Play icon for tracks
		);
	}
}