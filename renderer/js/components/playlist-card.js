// Playlist card component for discovery / library grids
import { createCover } from './cover.js';
export function renderPlaylistCard(playlist, onClick) {
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
export function renderPlaylistGrid(container, playlists, onCardClick) {
    container.innerHTML = '';
    container.className = 'scroll-h';
    playlists.forEach((pl) => {
        const card = renderPlaylistCard(pl, () => onCardClick(pl));
        container.appendChild(card);
    });
}
//# sourceMappingURL=playlist-card.js.map