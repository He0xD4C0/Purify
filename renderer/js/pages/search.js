// Search results page — full-featured: parallel fetch, cached tabs, rich cards
import { api } from '../core/api.js';
import { playTrack, addToQueue } from '../core/app.js';
import { renderSongList } from '../components/song-list.js';
// ---- Tab definitions ----
const TABS = [
    { key: 'song', label: '歌曲', type: 1 },
    { key: 'album', label: '专辑', type: 10 },
    { key: 'artist', label: '歌手', type: 100 },
    { key: 'playlist', label: '歌单', type: 1000 },
];
// ---- Page-level cache — fetched once, reused across tab switches ----
let cachedResults = {};
let cachedQuery = '';
let activeTab = 'song';
let loading = false;
export function renderSearch(container, query) {
    container.innerHTML = '';
    // Reset if new query
    if (query !== cachedQuery) {
        cachedQuery = query;
        cachedResults = {};
        activeTab = 'song';
    }
    // ---- Title ----
    const titleBar = document.createElement('div');
    titleBar.style.cssText = 'display:flex;align-items:center;gap:12px;margin-bottom:10px;';
    titleBar.innerHTML = `<h2 style="margin:0;font-size:20px;">${query}</h2>`;
    container.appendChild(titleBar);
    // ---- Tabs ----
    const tabBar = document.createElement('div');
    tabBar.className = 'search-tab-bar';
    tabBar.style.cssText = 'display:flex;gap:0;margin-bottom:20px;border-bottom:1px solid var(--border);';
    TABS.forEach((t) => {
        const btn = document.createElement('button');
        btn.className = 'search-tab-btn';
        btn.style.cssText = `
      padding:10px 20px;background:none;border:none;
      border-bottom:2px solid transparent;
      color:var(--text-secondary);font-size:14px;cursor:pointer;
      transition:all var(--transition-fast);
    `;
        btn.innerHTML = `${t.label}${cachedResults[t.key] ? ` <span style="font-size:11px;color:var(--text-muted);">${cachedResults[t.key].total}</span>` : ''}`;
        btn.dataset.key = t.key;
        if (t.key === activeTab) {
            btn.style.color = 'var(--text-primary)';
            btn.style.borderBottomColor = 'var(--accent)';
            btn.style.fontWeight = '600';
        }
        btn.addEventListener('click', () => {
            activeTab = t.key;
            tabBar.querySelectorAll('.search-tab-btn').forEach((b) => {
                const el = b;
                el.style.color = 'var(--text-secondary)';
                el.style.fontWeight = '';
                el.style.borderBottomColor = 'transparent';
            });
            btn.style.color = 'var(--text-primary)';
            btn.style.fontWeight = '600';
            btn.style.borderBottomColor = 'var(--accent)';
            renderActiveTab(resultsWrap);
        });
        tabBar.appendChild(btn);
    });
    container.appendChild(tabBar);
    // ---- Results area ----
    const resultsWrap = document.createElement('div');
    resultsWrap.id = 'search-results';
    container.appendChild(resultsWrap);
    // Fetch if needed, else render cached
    if (!cachedResults.song && !loading) {
        fetchAll(query, resultsWrap);
    }
    else if (loading) {
        resultsWrap.innerHTML = '<p class="text-muted text-sm" style="padding:20px;">搜索中...</p>';
    }
    else {
        renderActiveTab(resultsWrap);
    }
}
// ============ Fetch ============
async function fetchAll(query, container) {
    loading = true;
    container.innerHTML = '<p class="text-muted text-sm" style="padding:20px;">搜索中...</p>';
    const results = await Promise.allSettled(TABS.map((t) => api.cloudsearch(query, t.type, 50).then((res) => {
        const r = res.result || {};
        return {
            key: t.key,
            total: r.songCount || r.albumCount || r.artistCount || r.playlistCount || 0,
            data: r.songs || r.albums || r.artists || r.playlists || [],
        };
    })));
    results.forEach((r) => {
        if (r.status === 'fulfilled') {
            cachedResults[r.value.key] = { total: r.value.total, data: r.value.data };
        }
    });
    loading = false;
    // Refresh tabs with counts
    const pageContainer = document.getElementById('content');
    if (pageContainer && cachedQuery === query) {
        renderSearch(pageContainer, query);
    }
}
// ============ Tab rendering ============
function renderActiveTab(container) {
    const cached = cachedResults[activeTab];
    if (!cached) {
        container.innerHTML = '';
        return;
    }
    switch (activeTab) {
        case 'song':
            renderSongResults(container, cached.data);
            break;
        case 'album':
            renderAlbumResults(container, cached.data);
            break;
        case 'artist':
            renderArtistResults(container, cached.data);
            break;
        case 'playlist':
            renderPlaylistResults(container, cached.data);
            break;
    }
}
// ============ Song ============
function renderSongResults(container, songs) {
    if (!songs.length) {
        container.innerHTML = '<p class="text-muted text-sm" style="padding:20px;">无结果</p>';
        return;
    }
    const tracks = songs.map((s) => ({
        id: s.id,
        name: s.name,
        artists: (s.ar || []).map((a) => ({ id: a.id, name: a.name })),
        album: { id: s.al?.id || 0, name: s.al?.name || '', picUrl: s.al?.picUrl || '' },
        duration: s.dt || 0,
        fee: s.fee,
        privilege: s.privilege,
    }));
    // "Play all" header
    const header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;gap:12px;padding:8px 12px;margin-bottom:4px;';
    header.innerHTML = `
    <button class="search-play-all" style="
      padding:6px 16px;background:var(--accent);color:white;border:none;
      border-radius:var(--radius-pill);font-size:13px;cursor:pointer;
    ">▶ 播放全部</button>
    <span style="font-size:12px;color:var(--text-muted);">共 ${songs.length} 首</span>
  `;
    header.querySelector('.search-play-all')?.addEventListener('click', () => {
        const mapped = songs.map(mapCloudTrack);
        mapped.forEach((t) => addToQueue(t));
        if (mapped.length > 0)
            playTrack(mapped[0], mapped);
    });
    container.innerHTML = '';
    container.appendChild(header);
    renderSongList(tracks, {
        container,
        onPlay: (_, i) => playTrack(mapCloudTrack(songs[i]), songs.map(mapCloudTrack)),
    });
}
// ============ Album ============
function renderAlbumResults(container, albums) {
    if (!albums.length) {
        container.innerHTML = '<p class="text-muted text-sm" style="padding:20px;">无结果</p>';
        return;
    }
    container.innerHTML = '';
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:16px;';
    albums.forEach((a) => {
        const card = document.createElement('div');
        card.style.cssText = 'cursor:pointer;transition:transform var(--transition-fast);';
        card.addEventListener('mouseenter', () => { card.style.transform = 'translateY(-2px)'; });
        card.addEventListener('mouseleave', () => { card.style.transform = ''; });
        card.addEventListener('click', () => { });
        const year = a.publishTime ? new Date(a.publishTime).getFullYear() : '';
        card.innerHTML = `
      <img style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:var(--radius-pill);background:var(--bg-tertiary);" src="${a.picUrl || ''}?param=400y400" alt="${a.name}">
      <div style="margin-top:8px;font-size:14px;font-weight:500;line-height:1.3;
        display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${a.name}</div>
      <div style="font-size:12px;color:var(--text-muted);margin-top:3px;">
        ${a.artist?.name || ''}${year ? ` · ${year}` : ''}
      </div>
    `;
        grid.appendChild(card);
    });
    container.appendChild(grid);
}
// ============ Artist ============
function renderArtistResults(container, artists) {
    if (!artists.length) {
        container.innerHTML = '<p class="text-muted text-sm" style="padding:20px;">无结果</p>';
        return;
    }
    container.innerHTML = '';
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:16px;';
    artists.forEach((a) => {
        const card = document.createElement('div');
        card.style.cssText = 'text-align:center;cursor:pointer;';
        card.addEventListener('click', () => { });
        card.innerHTML = `
      <img style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:50%;background:var(--bg-tertiary);" src="${a.picUrl || a.img1v1Url || ''}?param=300y300" alt="${a.name}">
      <div style="margin-top:10px;font-size:14px;font-weight:500;">${a.name}</div>
      ${a.alias && a.alias.length > 0 ? `<div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${a.alias.join(' / ')}</div>` : ''}
      ${a.albumSize ? `<div style="font-size:11px;color:var(--text-muted);">${a.albumSize} 张专辑</div>` : ''}
    `;
        grid.appendChild(card);
    });
    container.appendChild(grid);
}
// ============ Playlist ============
function renderPlaylistResults(container, playlists) {
    if (!playlists.length) {
        container.innerHTML = '<p class="text-muted text-sm" style="padding:20px;">无结果</p>';
        return;
    }
    container.innerHTML = '';
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:16px;';
    playlists.forEach((pl) => {
        const card = document.createElement('div');
        card.style.cssText = 'cursor:pointer;transition:transform var(--transition-fast);';
        card.addEventListener('mouseenter', () => { card.style.transform = 'translateY(-2px)'; });
        card.addEventListener('mouseleave', () => { card.style.transform = ''; });
        card.addEventListener('click', () => { window.location.hash = `playlist/${pl.id}`; });
        card.innerHTML = `
      <img style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:var(--radius-pill);background:var(--bg-tertiary);" src="${pl.coverImgUrl || ''}?param=400y400" alt="${pl.name}">
      <div style="margin-top:8px;font-size:14px;font-weight:500;line-height:1.3;
        display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${pl.name}</div>
      <div style="font-size:12px;color:var(--text-muted);margin-top:3px;">
        ${pl.trackCount ? `${pl.trackCount} 首` : ''}${pl.creator?.nickname ? ` · by ${pl.creator.nickname}` : ''}
      </div>
    `;
        grid.appendChild(card);
    });
    container.appendChild(grid);
}
// ============ Helpers ============
function mapCloudTrack(raw) {
    return {
        id: raw.id,
        name: raw.name,
        artists: (raw.ar || []).map((a) => ({ id: a.id, name: a.name })),
        album: { id: raw.al?.id || 0, name: raw.al?.name || '', picUrl: raw.al?.picUrl || '' },
        duration: raw.dt || 0,
        fee: raw.fee,
        privilege: raw.privilege,
    };
}
//# sourceMappingURL=search.js.map