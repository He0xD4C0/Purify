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

  // ---- Nav: back / forward ----
  const navBar = document.createElement('div');
  navBar.className = 'search-nav-bar';
  navBar.style.cssText = 'display:flex;align-items:center;gap:8px;';

  const backBtn = document.createElement('button');
  backBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><polyline points="15 18 9 12 15 6"/></svg>';
  backBtn.title = '后退';
  backBtn.className = 'search-nav-btn';
  backBtn.style.cssText = 'width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:50%;color:var(--text-secondary);cursor:pointer;';
  backBtn.addEventListener('click', () => history.back());

  const fwdBtn = document.createElement('button');
  fwdBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><polyline points="9 18 15 12 9 6"/></svg>';
  fwdBtn.title = '前进';
  fwdBtn.className = 'search-nav-btn';
  fwdBtn.style.cssText = 'width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:50%;color:var(--text-secondary);cursor:pointer;';
  fwdBtn.addEventListener('click', () => history.forward());

  let canGoForward = false;

  function updateNavButtons(): void {
    backBtn.style.opacity = '0.35';
    fwdBtn.style.opacity = canGoForward ? '' : '0.35';
    (fwdBtn as HTMLButtonElement).disabled = !canGoForward;
  }

  // Track: when user goes back (popstate), there's forward history
  window.addEventListener('popstate', () => { canGoForward = true; updateNavButtons(); }, { once: true });

  updateNavButtons();

  // ---- Header row: nav buttons + title ----
  const titleBar = document.createElement('div');
  titleBar.className = 'search-nav-bar';
  titleBar.style.cssText = 'display:flex;align-items:center;gap:12px;margin-bottom:20px;';

  navBar.appendChild(backBtn);
  navBar.appendChild(fwdBtn);
  titleBar.appendChild(navBar);

  const title = document.createElement('h2');
  title.style.cssText = 'margin:0;font-size:20px;';
  title.textContent = query;
  titleBar.appendChild(title);
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
        const el = b as HTMLElement;
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
    <button class="search-play-all" style="
      padding:6px 16px;background:var(--accent);color:white;border:none;
      border-radius:var(--radius-pill);font-size:13px;cursor:pointer;
    ">▶ 播放全部</button>
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
  grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:16px;';

  albums.forEach((a: any) => {
    const card = document.createElement('div');
    card.style.cssText = 'cursor:pointer;transition:transform var(--transition-fast);';
    card.addEventListener('mouseenter', () => { card.style.transform = 'translateY(-2px)'; });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    card.addEventListener('click', () => { /* album detail — future */ });

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

function renderArtistResults(container: HTMLElement, artists: any[]): void {
  if (!artists.length) { container.innerHTML = '<p class="text-muted text-sm" style="padding:20px;">无结果</p>'; return; }
  container.innerHTML = '';
  const grid = document.createElement('div');
  grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:16px;';

  artists.forEach((a: any) => {
    const card = document.createElement('div');
    card.style.cssText = 'text-align:center;cursor:pointer;';
    card.addEventListener('click', () => { /* artist detail — future */ });
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

function renderPlaylistResults(container: HTMLElement, playlists: any[]): void {
  if (!playlists.length) { container.innerHTML = '<p class="text-muted text-sm" style="padding:20px;">无结果</p>'; return; }
  container.innerHTML = '';
  const grid = document.createElement('div');
  grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:16px;';

  playlists.forEach((pl: any) => {
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
