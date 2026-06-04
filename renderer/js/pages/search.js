// Search results page — song/album/artist/playlist tabs
import { api } from '../core/api.js';
import { playTrack } from '../core/app.js';
import { renderSongList } from '../components/song-list.js';
const SEARCH_TYPES = [
    { key: 'song', label: '歌曲', type: 1 },
    { key: 'album', label: '专辑', type: 10 },
    { key: 'artist', label: '歌手', type: 100 },
    { key: 'playlist', label: '歌单', type: 1000 },
];
let activeTab = 'song';
export function renderSearch(container, query) {
    container.innerHTML = '';
    activeTab = 'song';
    // Header
    const header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;gap:12px;margin-bottom:16px;';
    header.innerHTML = `
    <h2 style="margin:0;font-size:18px;">搜索: "${query}"</h2>
  `;
    container.appendChild(header);
    // Tabs
    const tabs = document.createElement('div');
    tabs.className = 'search-tabs';
    tabs.style.cssText = 'display:flex;gap:4px;margin-bottom:16px;border-bottom:1px solid var(--border);padding-bottom:0;';
    SEARCH_TYPES.forEach((t) => {
        const btn = document.createElement('button');
        btn.className = 'search-tab';
        btn.style.cssText = `
      padding:8px 16px;background:none;border:none;border-bottom:2px solid transparent;
      color:var(--text-secondary);font-size:14px;cursor:pointer;
      transition:all var(--transition-fast);
    `;
        btn.textContent = t.label;
        btn.dataset.key = t.key;
        if (t.key === activeTab) {
            btn.style.color = 'var(--text-primary)';
            btn.style.borderBottomColor = 'var(--accent)';
        }
        btn.addEventListener('click', () => {
            activeTab = t.key;
            tabs.querySelectorAll('.search-tab').forEach((b) => {
                const el = b;
                el.style.color = 'var(--text-secondary)';
                el.style.borderBottomColor = 'transparent';
            });
            btn.style.color = 'var(--text-primary)';
            btn.style.borderBottomColor = 'var(--accent)';
            fetchResults(resultsWrap, query, t.type);
        });
        tabs.appendChild(btn);
    });
    container.appendChild(tabs);
    // Results area
    const resultsWrap = document.createElement('div');
    resultsWrap.id = 'search-results';
    container.appendChild(resultsWrap);
    // Initial fetch
    fetchResults(resultsWrap, query, 1);
}
async function fetchResults(container, query, type) {
    container.innerHTML = '<p class="text-muted text-sm" style="padding:20px;">搜索中...</p>';
    try {
        const res = await api.cloudsearch(query, type, 30);
        const result = res.result || {};
        switch (type) {
            case 1:
                renderSongResults(container, result.songs || [], query);
                break;
            case 10:
                renderAlbumResults(container, result.albums || []);
                break;
            case 100:
                renderArtistResults(container, result.artists || []);
                break;
            case 1000:
                renderPlaylistResults(container, result.playlists || []);
                break;
        }
    }
    catch {
        container.innerHTML = '<p class="text-muted text-sm" style="padding:20px;">搜索失败，请重试</p>';
    }
}
// ---- Song results ----
function renderSongResults(container, songs, query) {
    if (songs.length === 0) {
        container.innerHTML = `<p class="text-muted text-sm" style="padding:20px;">未找到与"${query}"相关的歌曲</p>`;
        return;
    }
    const tracks = songs.map((s) => ({
        id: s.id,
        name: s.name,
        artists: (s.ar || []).map((a) => ({ id: a.id, name: a.name })),
        album: {
            id: s.al?.id || 0,
            name: s.al?.name || '',
            picUrl: s.al?.picUrl || '',
        },
        duration: s.dt || 0,
        fee: s.fee,
        privilege: s.privilege,
    }));
    renderSongList(tracks, {
        container,
        onPlay: (_, i) => {
            const t = songs[i];
            const track = mapCloudTrack(t);
            playTrack(track, songs.map(mapCloudTrack));
        },
    });
}
function mapCloudTrack(raw) {
    return {
        id: raw.id,
        name: raw.name,
        artists: (raw.ar || []).map((a) => ({ id: a.id, name: a.name })),
        album: {
            id: raw.al?.id || 0,
            name: raw.al?.name || '',
            picUrl: raw.al?.picUrl || '',
        },
        duration: raw.dt || 0,
        fee: raw.fee,
        privilege: raw.privilege,
    };
}
// ---- Album results ----
function renderAlbumResults(container, albums) {
    if (albums.length === 0) {
        container.innerHTML = '<p class="text-muted text-sm" style="padding:20px;">无结果</p>';
        return;
    }
    container.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'scroll-h';
    albums.forEach((a) => {
        const card = document.createElement('div');
        card.className = 'playlist-card';
        card.innerHTML = `
      <img class="card-cover" src="${a.picUrl || a.coverImgUrl || ''}?param=300y300" alt="${a.name}">
      <div class="card-title">${a.name}</div>
      <div style="font-size:11px;color:var(--text-muted);">${a.artist?.name || ''}</div>
    `;
        card.addEventListener('click', () => {
            // Navigate to album detail (future)
        });
        grid.appendChild(card);
    });
    container.appendChild(grid);
}
// ---- Artist results ----
function renderArtistResults(container, artists) {
    if (artists.length === 0) {
        container.innerHTML = '<p class="text-muted text-sm" style="padding:20px;">无结果</p>';
        return;
    }
    container.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'scroll-h';
    artists.forEach((a) => {
        const card = document.createElement('div');
        card.className = 'playlist-card';
        card.innerHTML = `
      <img class="card-cover" src="${a.picUrl || a.img1v1Url || ''}?param=300y300" alt="${a.name}" style="border-radius:50%;">
      <div class="card-title" style="text-align:center;">${a.name}</div>
    `;
        card.addEventListener('click', () => {
            // Navigate to artist detail (future)
        });
        grid.appendChild(card);
    });
    container.appendChild(grid);
}
// ---- Playlist results ----
function renderPlaylistResults(container, playlists) {
    if (playlists.length === 0) {
        container.innerHTML = '<p class="text-muted text-sm" style="padding:20px;">无结果</p>';
        return;
    }
    container.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'scroll-h';
    playlists.forEach((pl) => {
        const card = document.createElement('div');
        card.className = 'playlist-card';
        card.innerHTML = `
      <img class="card-cover" src="${pl.coverImgUrl || ''}?param=300y300" alt="${pl.name}">
      <div class="card-title">${pl.name}</div>
      <div style="font-size:11px;color:var(--text-muted);">${pl.trackCount || 0} 首</div>
    `;
        card.addEventListener('click', () => {
            window.location.hash = `playlist/${pl.id}`;
        });
        grid.appendChild(card);
    });
    container.appendChild(grid);
}
//# sourceMappingURL=search.js.map