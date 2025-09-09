import * as vscode from "vscode";
import { SpotifyApi } from "../spotify/api";
import { SpotifyTreeItem, SpotifyDevice } from "../types";

export class SpotifySidebarProvider
	implements vscode.TreeDataProvider<SpotifyTreeItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<
		SpotifyTreeItem | undefined | void
	> = new vscode.EventEmitter<SpotifyTreeItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<
		SpotifyTreeItem | undefined | void
	> = this._onDidChangeTreeData.event;

	constructor(
		private spotifyApi: SpotifyApi,
		private viewId: string,
	) { }

	getTreeItem(element: SpotifyTreeItem): vscode.TreeItem {
		return element;
	}

	/**
	 * Creates an empty state tree item to show when there's no data
	 */
	private createEmptyStateItem(): SpotifyTreeItem {
		return new SpotifyTreeItem(
			"Nothing to show here...",
			"empty-state",
			"",
			"track", // Use track type as it's a leaf node
			vscode.TreeItemCollapsibleState.None,
			undefined, // No command
			undefined, // No icon
		);
	}

	async getChildren(element?: SpotifyTreeItem): Promise<SpotifyTreeItem[]> {
		if (!element) {
			// This is the root of the tree, populate with top-level items
			switch (this.viewId) {
				case "xiliePlaylists":
					const playlists = await this.spotifyApi.getUserPlaylists();
					if (playlists && playlists.items && playlists.items.length > 0) {
						return playlists.items.map((p: any) =>
							SpotifyTreeItem.fromPlaylist(p),
						);
					}
					return [this.createEmptyStateItem()];
				case "xilieDevices":
					const devicesResponse = await this.spotifyApi.getAvailableDevices();
					if (devicesResponse && devicesResponse.devices && devicesResponse.devices.length > 0) {
						return devicesResponse.devices.map((d: any) =>
							SpotifyTreeItem.fromDevice({
								id: d.id,
								name: d.name,
								deviceType: d.type,
								isActive: d.is_active,
								isRestricted: d.is_restricted,
								type: "device",
							} as SpotifyDevice),
						);
					}
					return [this.createEmptyStateItem()];
				case "xilieArtists": // New case for Artists view
					const artistsResponse = await this.spotifyApi.getFollowedArtists();
					if (
						artistsResponse &&
						artistsResponse.artists &&
						artistsResponse.artists.items &&
						artistsResponse.artists.items.length > 0
					) {
						return artistsResponse.artists.items.map((a: any) =>
							SpotifyTreeItem.fromArtist(a),
						);
					}
					return [this.createEmptyStateItem()];
				case "xilieRecents":
					try {
						const response = await this.spotifyApi.getRecentTracks();
						const tracks = Array.from(
							new Map(
								response.items?.map((item: any) => [item.track.id, item.track]) ||
								[],
							).values(),
						);
						if (tracks.length > 0) {
							return tracks.map((track: any) => SpotifyTreeItem.fromTrack(track));
						}
						return [this.createEmptyStateItem()];
					} catch (error) {
						console.error("Error fetching recent tracks:", error);
						return [this.createEmptyStateItem()];
					}
				default:
					return [this.createEmptyStateItem()];
			}
		} else if (
			element.collapsibleState === vscode.TreeItemCollapsibleState.Collapsed
		) {
			// This is an expandable item, populate with its children
			switch (element.spotifyType) {
				case "playlist":
					try {
						const response = await this.spotifyApi.getPlaylistTracks(
							element.spotifyId,
						);
						const tracks = response.items?.map((item: any) => item.track) || [];
						if (tracks.length > 0) {
							return tracks.map((track: any) => SpotifyTreeItem.fromTrack(track));
						}
						return [this.createEmptyStateItem()];
					} catch (error) {
						console.error("Error fetching playlist tracks:", error);
						return [this.createEmptyStateItem()];
					}
				case "artist": // Handle artist's top tracks
					try {
						const response = await this.spotifyApi.getArtistTopTracks(
							element.spotifyId,
						);
						const tracks = Array.isArray(response)
							? response
							: response?.tracks || [];
						if (tracks.length > 0) {
							return tracks.map((track: any) => SpotifyTreeItem.fromTrack(track));
						}
						return [this.createEmptyStateItem()];
					} catch (error) {
						console.error("Error fetching artist top tracks:", error);
						return [this.createEmptyStateItem()];
					}
				default:
					return [this.createEmptyStateItem()];
			}
		}

		return [this.createEmptyStateItem()];
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}
}
