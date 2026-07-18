// Unified collection detail page — handles both playlist and album

import { state, playTrack, type Track } from '../core/app.js';
import { api } from '../core/api.js';
import { renderSongList, type SongListTrack } from '../components/song-list.js';
import { createCover } from '../components/cover.js';
import { loadCSS } from '../core/css-loader.js';

loadCSS('css/detail.css');

export type CollectionType = 'playlist' | 'album';

interface CollectionMeta {
  name: string;
  coverUrl: string;
  description: string;
  subtitle: string;       // e.g. "张悬 · 2012/8/10 · 9 首"
  tracks: Track[];
}

/**
 * Render a playlist or album detail page.
 * Shared layout: cover header → song list.
 */
export function renderCollectionDetail(
  container: HTMLElement,
  type: CollectionType,
  id: number,
): void {
  container.innerHTML = '<p class="text-muted">加载中...</p>';

  const fetcher = type === 'playlist' ? fetchPlaylist : fetchAlbum;

  fetcher(id)
    .then((meta) => {
      container.innerHTML = '';
      renderHeader(container, meta);
      renderTracks(container, meta.tracks);
    })
    .catch(() => {
      const label = type === 'playlist' ? '歌单' : '专辑';
      container.innerHTML = `<p class="text-muted">加载${label}失败</p>`;
    });
}

// ---- Data fetching ----

async function fetchPlaylist(id: number): Promise<CollectionMeta> {
  const res = await api.playlistDetail(id);
  const pl = res.playlist;
  if (!pl) throw new Error('not found');

  const trackRes = await api.playlistTrackAll(id);
  const tracks = mapSongs(trackRes.songs || []);

  return {
    name: pl.name,
    coverUrl: pl.coverImgUrl,
    description: pl.description || '',
    subtitle: `${pl.creator?.nickname || ''} · ${pl.trackCount || tracks.length} 首`,
    tracks,
  };
}

async function fetchAlbum(id: number): Promise<CollectionMeta> {
  const res = await api.album(id);
  const album = res.album;
  if (!album) throw new Error('not found');

  const artistName = album.artist?.name
    || album.artists?.map((a: any) => a.name).join('/')
    || '';
  const pubDate = album.publishTime
    ? new Date(album.publishTime).toLocaleDateString('zh-CN')
    : '';
  const size = album.size || res.songs?.length || 0;

  const parts = [artistName, pubDate, `${size} 首`].filter(Boolean);

  return {
    name: album.name,
    coverUrl: album.picUrl,
    description: album.description || '',
    subtitle: parts.join(' · '),
    tracks: mapSongs(res.songs || []),
  };
}

function mapSongs(songs: any[]): Track[] {
  return songs.map((s: any) => ({
    id: s.id,
    name: s.name,
    artists: (s.ar || []).map((a: any) => ({ id: a.id, name: a.name })),
    album: {
      id: s.al?.id || 0,
      name: s.al?.name || '',
      picUrl: s.al?.picUrl || '',
    },
    duration: s.dt || 0,
    fee: s.fee,
    privilege: s.privilege || s.priv,
  }));
}

// ---- Rendering ----

function renderHeader(container: HTMLElement, meta: CollectionMeta): void {
  const header = document.createElement('div');
  header.className = 'detail-header';

  // Cover — 1:1, sized by header height via JS
  const coverEl = createCover(meta.coverUrl, 160, { alt: meta.name });
  coverEl.classList.add('detail-cover');
  header.appendChild(coverEl);

  // Text info (right of cover)
  const textInfo = document.createElement('div');
  textInfo.className = 'detail-text';
  textInfo.innerHTML = `
    <h2 class="detail-title">${meta.name}</h2>
    <p class="detail-meta">${meta.subtitle}</p>
    <div class="detail-controls">
      <button class="detail-play-all">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        播放全部
      </button>
    </div>
  `;
  header.appendChild(textInfo);
  container.appendChild(header);

  // Size cover to match header height (1:1)
  requestAnimationFrame(() => {
    const headerH = header.getBoundingClientRect().height;
    coverEl.style.width = `${headerH}px`;
    coverEl.style.height = `${headerH}px`;
  });

  // Play all
  textInfo.querySelector('.detail-play-all')?.addEventListener('click', () => {
    if (meta.tracks.length > 0) playTrack(meta.tracks[0], meta.tracks);
  });
}

function renderTracks(container: HTMLElement, tracks: Track[]): void {
  if (tracks.length === 0) {
    container.appendChild(document.createElement('p')).textContent = '暂无歌曲';
    return;
  }

  const listWrap = document.createElement('div');
  container.appendChild(listWrap);

  const songListTracks: SongListTrack[] = tracks.map((t) => ({
    ...t,
    artists: t.artists,
    album: t.album,
  }));

  renderSongList(songListTracks, {
    container: listWrap,
    onPlay: (_, i) => playTrack(tracks[i], tracks),
  });
}
