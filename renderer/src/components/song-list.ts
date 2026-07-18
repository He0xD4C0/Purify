// Reusable song list/table component — hover-reveal actions column

import { bus } from '../core/event-bus.js';
import { state, formatDuration, type Track } from '../core/app.js';
import { detectStatus, renderBadge, type MusicStatus } from './music-badge.js';
import { createCover } from './cover.js';

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

// SVG icons for action buttons
const ICONS = {
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 00-7.8 7.8L12 21l8.9-8.9a5.5 5.5 0 000-7.8z"/></svg>',
  add: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="19" x2="5" y2="5"/><polygon points="10 5 20 12 10 19"/></svg>',
};

export function renderSongList(
  tracks: SongListTrack[],
  options: SongListOptions
): HTMLElement {
  const list = document.createElement('div');
  list.className = 'song-list';
  const typedTracks = tracks as unknown as Track[];

  tracks.forEach((track, i) => {
    const row = document.createElement('div');
    row.className = 'song-row';
    row.dataset.id = String(track.id);

    const isCurrent = state.currentTrack?.id === track.id;
    if (isCurrent) row.classList.add('playing');

    // ---- Index ----
    const numEl = document.createElement('span');
    numEl.className = 'song-index';
    numEl.textContent = options.numbered !== false ? String(i + 1) : '';

    // ---- Cover (click = play) ----
    if (options.showCover !== false) {
      const coverEl = createCover(track.album.picUrl || '', 40, {
        className: 'song-cover',
        onClick: (e) => {
          e.stopPropagation();
          options.onPlay?.(track, i);
        },
      });
      row.appendChild(numEl);
      row.appendChild(coverEl);
    } else {
      row.appendChild(numEl);
      row.appendChild(document.createElement('span'));
    }

    // ---- Title (click = play, contains text + badge) ----
    const titleEl = document.createElement('span');
    titleEl.className = 'song-title';

    const titleText = document.createElement('span');
    titleText.className = 'song-title-text';
    titleText.textContent = track.name;

    titleEl.appendChild(titleText);

    // Badge inline inside title
    if (options.showBadge !== false) {
      const status = track.status || detectStatus(track.fee || 0, track.privilege);
      const badge = renderBadge(status);
      if (badge) titleEl.appendChild(badge);
    }

    titleEl.addEventListener('click', (e) => {
      e.stopPropagation();
      options.onPlay?.(track, i);
    });

    // ---- Artist ----
    const artistEl = document.createElement('span');
    artistEl.className = 'song-artist';
    artistEl.textContent = track.artists.map((a) => a.name).join('/');

    row.appendChild(titleEl);
    row.appendChild(artistEl);

    // ---- Actions (between artist and duration) ----
    const actions = document.createElement('div');
    actions.className = 'song-actions';

    const playBtn = document.createElement('button');
    playBtn.className = 'sa-btn play-action';
    playBtn.title = '播放';
    playBtn.innerHTML = ICONS.play;
    playBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      options.onPlay?.(track, i);
    });
    actions.appendChild(playBtn);

    const likeBtn = document.createElement('button');
    likeBtn.className = 'sa-btn';
    likeBtn.title = '喜欢';
    likeBtn.innerHTML = ICONS.heart;
    likeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      bus.emit('player:like-toggle', track.id);
    });
    actions.appendChild(likeBtn);

    const nextBtn = document.createElement('button');
    nextBtn.className = 'sa-btn';
    nextBtn.title = '下一首播放';
    nextBtn.innerHTML = ICONS.next;
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const t = track as unknown as Track;
      state.queue.splice(state.queueIndex + 1, 0, t);
      bus.emit('queue:changed', state.queue);
    });
    actions.appendChild(nextBtn);

    row.appendChild(actions);

    // ---- Duration ----
    const durEl = document.createElement('span');
    durEl.className = 'song-duration';
    durEl.textContent = formatDuration(track.duration);
    row.appendChild(durEl);

    // Mobile: click anywhere on row to play
    row.addEventListener('click', (e) => {
      if (window.innerWidth >= 900) return; // desktop uses cover/title clicks only
      // Don't fire if user clicked an action button
      const target = e.target as HTMLElement;
      if (target.closest('.song-actions')) return;
      options.onPlay?.(track, i);
    });

    list.appendChild(row);
  });

  options.container.innerHTML = '';
  options.container.appendChild(list);
  return list;
}
