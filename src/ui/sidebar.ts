import * as vscode from "vscode";
import { SpotifyApi } from "../spotify/api";
import {
	SpotifyTreeItem,
	SpotifyPlaylist,
	SpotifyDevice,
	SpotifyArtist,
	SpotifyTrack,
} from "../types";

export class SpotifySidebarProvider
	implements vscode.TreeDataProvider<SpotifyTreeItem>
{
	private _onDidChangeTreeData: vscode.EventEmitter<
		SpotifyTreeItem | undefined | void
	> = new vscode.EventEmitter<SpotifyTreeItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<
		SpotifyTreeItem | undefined | void
	> = this._onDidChangeTreeData.event;

	constructor(
		private spotifyApi: SpotifyApi,
		private viewId: string,
	) {}

	getTreeItem(element: SpotifyTreeItem): vscode.TreeItem {
		return element;
	}

	async getChildren(element?: SpotifyTreeItem): Promise<SpotifyTreeItem[]> {
		if (!element) {
			// This is the root of the tree, populate with top-level items
			switch (this.viewId) {
				case "xiliePlaylists":
					const playlists = await this.spotifyApi.getUserPlaylists();
					if (playlists && playlists.items) {
						return playlists.items.map((p: any) =>
							SpotifyTreeItem.fromPlaylist(p),
						);
					}
					return [];
				case "xilieDevices":
					const devicesResponse = await this.spotifyApi.getAvailableDevices();
					if (devicesResponse && devicesResponse.devices) {
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
					return [];
				case "xilieArtists": // New case for Artists view
					const artistsResponse = await this.spotifyApi.getFollowedArtists();
					if (
						artistsResponse &&
						artistsResponse.artists &&
						artistsResponse.artists.items
					) {
						return artistsResponse.artists.items.map((a: any) =>
							SpotifyTreeItem.fromArtist(a),
						);
					}
					return [];
				default:
					return [];
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
						const tracks = response.items?.map((item: any) => item.track) || [
							{
								name: "No tracks found",
								uri: "",
								id: "",
								artists: [{ name: "N/A" }],
							},
						]; // No tracks found
						return tracks.map((track: any) => SpotifyTreeItem.fromTrack(track));
					} catch (error) {
						console.error("Error fetching playlist tracks:", error);
						return [];
					}
				case "artist": // Handle artist's top tracks
					try {
						const response = await this.spotifyApi.getArtistTopTracks(
							element.spotifyId,
						);
						const tracks = Array.isArray(response)
							? response
							: response?.tracks || [
									{
										name: "No tracks found",
										uri: "",
										id: "",
										artists: [{ name: "N/A" }],
									},
								];
						return tracks.map((track: any) => SpotifyTreeItem.fromTrack(track));
					} catch (error) {
						console.error("Error fetching artist top tracks:", error);
						return [];
					}
				default:
					return [];
			}
		}

		return [];
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}
}
