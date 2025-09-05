/**
 * Spotify API response types for better type safety
 */

export interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: SpotifyImage[];
}

export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

export interface SpotifyPlaybackState {
  device: SpotifyDevice;
  repeat_state: string;
  shuffle_state: boolean;
  context: SpotifyContext | null;
  timestamp: number;
  progress_ms: number;
  is_playing: boolean;
  item: SpotifyTrack;
  currently_playing_type: string;
  actions: SpotifyActions;
}

export interface SpotifyDevice {
  id: string;
  is_active: boolean;
  is_private_session: boolean;
  is_restricted: boolean;
  name: string;
  type: string;
  volume_percent: number;
}

export interface SpotifyContext {
  type: string;
  href: string;
  external_urls: SpotifyExternalUrls;
  uri: string;
}

export interface SpotifyExternalUrls {
  spotify: string;
}

export interface SpotifyActions {
  interrupting_playback?: boolean;
  pausing?: boolean;
  resuming?: boolean;
  seeking?: boolean;
  skipping_next?: boolean;
  skipping_prev?: boolean;
  toggling_repeat_context?: boolean;
  toggling_shuffle?: boolean;
  toggling_repeat_track?: boolean;
  transferring_playback?: boolean;
}

export interface SpotifyArtist {
  external_urls: SpotifyExternalUrls;
  followers: SpotifyFollowers;
  genres: string[];
  href: string;
  id: string;
  images: SpotifyImage[];
  name: string;
  popularity: number;
  type: string;
  uri: string;
}

export interface SpotifyFollowers {
  href: string | null;
  total: number;
}

export interface SpotifyTrack {
  album: SpotifyAlbum;
  artists: SpotifyArtist[];
  available_markets: string[];
  disc_number: number;
  duration_ms: number;
  explicit: boolean;
  external_ids: SpotifyExternalIds;
  external_urls: SpotifyExternalUrls;
  href: string;
  id: string;
  is_playable: boolean;
  linked_from?: SpotifyLinkedTrack;
  restrictions?: SpotifyRestrictions;
  name: string;
  popularity: number;
  preview_url: string | null;
  track_number: number;
  type: string;
  uri: string;
  is_local: boolean;
}

export interface SpotifyAlbum {
  album_type: string;
  total_tracks: number;
  available_markets: string[];
  external_urls: SpotifyExternalUrls;
  href: string;
  id: string;
  images: SpotifyImage[];
  name: string;
  release_date: string;
  release_date_precision: string;
  restrictions?: SpotifyRestrictions;
  type: string;
  uri: string;
  artists: SpotifyArtist[];
}

export interface SpotifyExternalIds {
  isrc?: string;
  ean?: string;
  upc?: string;
}

export interface SpotifyLinkedTrack {
  external_urls: SpotifyExternalUrls;
  href: string;
  id: string;
  type: string;
  uri: string;
}

export interface SpotifyRestrictions {
  reason: string;
}

export interface SpotifyPlaylist {
  collaborative: boolean;
  description: string | null;
  external_urls: SpotifyExternalUrls;
  followers: SpotifyFollowers;
  href: string;
  id: string;
  images: SpotifyImage[];
  name: string;
  owner: SpotifyUser;
  public: boolean;
  snapshot_id: string;
  tracks: SpotifyPlaylistTracksRef;
  type: string;
  uri: string;
}

export interface SpotifyPlaylistTracksRef {
  href: string;
  total: number;
}

export interface SpotifyPagingObject<T> {
  href: string;
  items: T[];
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
}

export interface SpotifyError {
  error: {
    status: number;
    message: string;
  };
}