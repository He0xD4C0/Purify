// Search results page — full-featured: parallel fetch, cached tabs, rich cards

import { api } from '../core/api.js';
import { playTrack, addToQueue, type Track } from '../core/app.js';
import { renderSongList, type SongListTrack } from '../components/song-list.js';

// ---- Tab definitions ----
const TABS = [
  { key: 'song',     label: '歌曲',   type: 1 },
  { key: 'album',    label: '专辑',   type: 10 },
  { key: 'artist',   label: '歌手',   type: 100 },
  { key: 'playlist', label: '歌单',   type: 1000 },
] as const;

// ---- Page-level cache — fetched once, reused across tab switches ----
let cachedResults: Record<string, { total: number; data: any[] }> = {};
let cachedQuery = '';
let activeTab = 'song';
let loading = false;

export function renderSearch(container: HTMLElement, query: string): void {
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

  TABS.forEach((t) => {
    const btn = document.createElement('button');
    btn.className = 'search-tab-btn' + (t.key === activeTab ? ' active' : '');
    btn.innerHTML = `${t.label}${cachedResults[t.key] ? ` <span style="font-size:11px;color:var(--text-muted);">${cachedResults[t.key].total}</span>` : ''}`;
    btn.dataset.key = t.key;

    btn.addEventListener('click', () => {
      activeTab = t.key;
      tabBar.querySelectorAll('.search-tab-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
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
  } else if (loading) {
    resultsWrap.innerHTML = '<p class="text-muted text-sm" style="padding:20px;">搜索中...</p>';
  } else {
    renderActiveTab(resultsWrap);
  }
}

// ============ Fetch ============

async function fetchAll(query: string, container: HTMLElement): Promise<void> {
  loading = true;
  container.innerHTML = '<p class="text-muted text-sm" style="padding:20px;">搜索中...</p>';

  const results = await Promise.allSettled(
    TABS.map((t) =>
      api.cloudsearch(query, t.type, 50).then((res) => {
        const r = res.result || {};
        return {
          key: t.key,
          total: r.songCount || r.albumCount || r.artistCount || r.playlistCount || 0,
          data: r.songs || r.albums || r.artists || r.playlists || [],
        };
      })
    )
  );

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

function renderActiveTab(container: HTMLElement): void {
  const cached = cachedResults[activeTab];
  if (!cached) { container.innerHTML = ''; return; }

  switch (activeTab) {
    case 'song':     renderSongResults(container, cached.data); break;
    case 'album':    renderAlbumResults(container, cached.data); break;
    case 'artist':   renderArtistResults(container, cached.data); break;
    case 'playlist': renderPlaylistResults(container, cached.data); break;
  }
}

// ============ Song ============

function renderSongResults(container: HTMLElement, songs: any[]): void {
  if (!songs.length) { container.innerHTML = '<p class="text-muted text-sm" style="padding:20px;">无结果</p>'; return; }

  const tracks: SongListTrack[] = songs.map((s: any) => ({
    id: s.id,
    name: s.name,
    artists: (s.ar || []).map((a: any) => ({ id: a.id, name: a.name })),
    album: { id: s.al?.id || 0, name: s.al?.name || '', picUrl: s.al?.picUrl || '' },
    duration: s.dt || 0,
    fee: s.fee,
    privilege: s.privilege,
  }));

  // "Play all" header
  const header = document.createElement('div');
  header.style.cssText = 'display:flex;align-items:center;gap:12px;padding:8px 12px;margin-bottom:4px;';
  header.innerHTML = `
    <button class="search-play-all">▶ 播放全部</button>
    <span style="font-size:12px;color:var(--text-muted);">共 ${songs.length} 首</span>
  `;
  header.querySelector('.search-play-all')?.addEventListener('click', () => {
    const mapped = songs.map(mapCloudTrack);
    mapped.forEach((t: Track) => addToQueue(t));
    if (mapped.length > 0) playTrack(mapped[0], mapped);
  });
  container.innerHTML = '';
  container.appendChild(header);

  renderSongList(tracks, {
    container,
    onPlay: (_, i) => playTrack(mapCloudTrack(songs[i]), songs.map(mapCloudTrack)),
  });
}

// ============ Album ============

function renderAlbumResults(container: HTMLElement, albums: any[]): void {
  if (!albums.length) { container.innerHTML = '<p class="text-muted text-sm" style="padding:20px;">无结果</p>'; return; }
  container.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'search-grid';

  albums.forEach((a: any) => {
    const card = document.createElement('div');
    card.className = 'search-card';
    card.addEventListener('click', () => { /* album detail — future */ });

    const year = a.publishTime ? new Date(a.publishTime).getFullYear() : '';
    card.innerHTML = `
      <img class="search-card-img" src="${a.picUrl || ''}?param=400y400" alt="${a.name}">
      <div class="search-card-name">${a.name}</div>
      <div class="search-card-sub">
        ${a.artist?.name || ''}${year ? ` · ${year}` : ''}
      </div>
    `;
    grid.appendChild(card);
  });
  container.appendChild(grid);
}

// ============ Artist ============

function renderArtistResults(container: HTMLElement, artists: any[]): void {
  if (!artists.length) { container.innerHTML = '<p class="text-muted text-sm" style="padding:20px;">无结果</p>'; return; }
  container.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'search-grid-artist';

  artists.forEach((a: any) => {
    const card = document.createElement('div');
    card.className = 'search-card';
    card.style.textAlign = 'center';
    card.addEventListener('click', () => { /* artist detail — future */ });
    card.innerHTML = `
      <img class="search-card-img circle" src="${a.picUrl || a.img1v1Url || ''}?param=300y300" alt="${a.name}">
      <div class="search-artist-name">${a.name}</div>
      ${a.alias && a.alias.length > 0 ? `<div class="search-artist-alias">${a.alias.join(' / ')}</div>` : ''}
      ${a.albumSize ? `<div class="search-artist-count">${a.albumSize} 张专辑</div>` : ''}
    `;
    grid.appendChild(card);
  });
  container.appendChild(grid);
}

// ============ Playlist ============

function renderPlaylistResults(container: HTMLElement, playlists: any[]): void {
  if (!playlists.length) { container.innerHTML = '<p class="text-muted text-sm" style="padding:20px;">无结果</p>'; return; }
  container.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'search-grid';

  playlists.forEach((pl: any) => {
    const card = document.createElement('div');
    card.className = 'search-card';
    card.addEventListener('click', () => { window.location.hash = `playlist/${pl.id}`; });
    card.innerHTML = `
      <img class="search-card-img" src="${pl.coverImgUrl || ''}?param=400y400" alt="${pl.name}">
      <div class="search-card-name">${pl.name}</div>
      <div class="search-card-sub">
        ${pl.trackCount ? `${pl.trackCount} 首` : ''}${pl.creator?.nickname ? ` · by ${pl.creator.nickname}` : ''}
      </div>
    `;
    grid.appendChild(card);
  });
  container.appendChild(grid);
}

// ============ Helpers ============

function mapCloudTrack(raw: any): Track {
  return {
    id: raw.id,
    name: raw.name,
    artists: (raw.ar || []).map((a: any) => ({ id: a.id, name: a.name })),
    album: { id: raw.al?.id || 0, name: raw.al?.name || '', picUrl: raw.al?.picUrl || '' },
    duration: raw.dt || 0,
    fee: raw.fee,
    privilege: raw.privilege,
  };
}
