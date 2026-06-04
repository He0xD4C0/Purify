// Playlist card component for discovery / library grids
export function renderPlaylistCard(playlist, onClick) {
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
    // Play count
    if (playlist.playCount) {
        const count = document.createElement('div');
        count.className = 'card-sub';
        count.style.cssText = 'font-size:11px;color:var(--text-muted);margin-top:4px;';
        const n = playlist.playCount > 10000
            ? `${(playlist.playCount / 10000).toFixed(1)}万`
            : String(playlist.playCount);
        count.textContent = `▶ ${n}`;
        card.appendChild(count);
    }
    card.appendChild(cover);
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