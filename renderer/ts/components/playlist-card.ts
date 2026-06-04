// Playlist card component for discovery / library grids

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

  const cover = document.createElement('img');
  cover.className = 'card-cover';
  const pic = playlist.coverImgUrl || playlist.picUrl || '';
  cover.src = pic ? `${pic}?param=300y300` : '';
  cover.alt = playlist.name;
  cover.loading = 'lazy';
  cover.onerror = () => {
    cover.style.background = 'var(--bg-tertiary)';
  };

  const title = document.createElement('div');
  title.className = 'card-title';
  title.textContent = playlist.name;

  card.appendChild(cover);
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
