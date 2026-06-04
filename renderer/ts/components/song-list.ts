// Reusable song list/table component

import { bus } from '../core/event-bus.js';
import { state, playTrack, formatDuration, type Track } from '../core/app.js';
import { detectStatus, renderBadge, type MusicStatus } from './music-badge.js';

export interface SongListTrack {
  id: number;
  name: string;
  artists: { id: number; name: string }[];
  album: { id: number; name: string; picUrl?: string };
  duration: number;
  fee?: number;
  privilege?: Record<string, unknown>;
  status?: MusicStatus;
}

interface SongListOptions {
  container: HTMLElement;
  onPlay?: (track: SongListTrack, index: number) => void;
  showCover?: boolean;
  showAlbum?: boolean;
  showBadge?: boolean;
  numbered?: boolean;
}

export function renderSongList(
  tracks: SongListTrack[],
  options: SongListOptions
): HTMLElement {
  const list = document.createElement('div');
  list.className = 'song-list';

  tracks.forEach((track, i) => {
    const row = document.createElement('div');
    row.className = 'song-row';
    row.dataset.id = String(track.id);

    const isCurrent = state.currentTrack?.id === track.id;
    if (isCurrent) row.classList.add('playing');

    // Number
    const numEl = document.createElement('span');
    numEl.className = 'song-index';
    numEl.textContent = options.numbered !== false ? String(i + 1) : '';

    // Cover
    if (options.showCover !== false) {
      const cover = document.createElement('img');
      cover.className = 'song-cover';
      cover.src = track.album.picUrl
        ? `${track.album.picUrl}?param=80y80`
        : '';
      cover.alt = '';
      cover.loading = 'lazy';
      cover.onerror = () => {
        cover.style.display = 'none';
      };
      row.appendChild(numEl);
      row.appendChild(cover);
    } else {
      row.appendChild(numEl);
      // spacer
      const sp = document.createElement('span');
      row.appendChild(sp);
    }

    // Title
    const titleEl = document.createElement('span');
    titleEl.className = 'song-title';
    titleEl.textContent = track.name;

    // Artist
    const artistEl = document.createElement('span');
    artistEl.className = 'song-artist';
    artistEl.textContent = track.artists.map((a) => a.name).join('/');

    // Duration
    const durEl = document.createElement('span');
    durEl.className = 'song-duration';
    durEl.textContent = formatDuration(track.duration);

    row.appendChild(titleEl);
    row.appendChild(artistEl);
    row.appendChild(durEl);

    // Badge
    if (options.showBadge !== false) {
      const badgeWrap = document.createElement('span');
      badgeWrap.className = 'song-badge';
      if (track.status) {
        badgeWrap.appendChild(renderBadge(track.status));
      } else if (track.fee !== undefined || track.privilege) {
        const status = detectStatus(track.fee || 0, track.privilege);
        badgeWrap.appendChild(renderBadge(status));
      }
      row.appendChild(badgeWrap);
    } else {
      const sp = document.createElement('span');
      row.appendChild(sp);
    }

    // Double click = play
    row.addEventListener('dblclick', () => {
      const t = tracks[i] as unknown as Track;
      playTrack(t, tracks as unknown as Track[]);
    });

    // Single click
    row.addEventListener('click', () => {
      options.onPlay?.(track, i);
    });

    list.appendChild(row);
  });

  options.container.innerHTML = '';
  options.container.appendChild(list);
  return list;
}
