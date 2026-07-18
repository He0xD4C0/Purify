// Playlist card component for discovery / library grids

import { createCover } from './cover.js';

export interface PlaylistInfo {
  id: number;
  name: string;
  coverImgUrl?: string;
  picUrl?: string;
  playCount?: number;
  trackCount?: number;
  creator?: { nickname: string };
}

export function renderPlaylistCard(
  playlist: PlaylistInfo,
  onClick: () => void
): HTMLElement {
  const card = document.createElement('div');
  card.className = 'playlist-card';

  const pic = playlist.coverImgUrl || playlist.picUrl || '';
  const coverEl = createCover(pic, 120, {
    className: 'card-cover',
    alt: playlist.name,
  });

  const title = document.createElement('div');
  title.className = 'card-title';
  title.textContent = playlist.name;

  card.appendChild(coverEl);
  card.appendChild(title);
  card.addEventListener('click', onClick);

  return card;
}

export function renderPlaylistGrid(
  container: HTMLElement,
  playlists: PlaylistInfo[],
  onCardClick: (playlist: PlaylistInfo) => void
): void {
  container.innerHTML = '';
  container.className = 'scroll-h';

  playlists.forEach((pl) => {
    const card = renderPlaylistCard(pl, () => onCardClick(pl));
    container.appendChild(card);
  });
}
