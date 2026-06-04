// Playlist detail page — for browsing online playlists

import { router } from '../core/router.js';
import { bus } from '../core/event-bus.js';
import { state, playTrack, type Track } from '../core/app.js';
import { api } from '../core/api.js';
import { renderSongList, type SongListTrack } from '../components/song-list.js';
import { createInteractiveCover } from '../patterns/interactive-cover.js';

export function renderPlaylistDetail(container: HTMLElement, id: number): void {
  container.innerHTML = '<p class="text-muted">加载中...</p>';

  api.playlistDetail(id).then((res) => {
    const pl = res.playlist;
    if (!pl) {
      container.innerHTML = '<p class="text-muted">歌单不存在</p>';
      return;
    }

    container.innerHTML = '';

    // Back button
    const backBtn = document.createElement('button');
    backBtn.textContent = '← 返回';
    backBtn.style.cssText = 'background:none;border:none;color:var(--accent);font-size:14px;cursor:pointer;margin-bottom:12px;';
    backBtn.addEventListener('click', () => {
      window.history.back();
    });
    container.appendChild(backBtn);

    // Header
    const header = document.createElement('div');
    header.style.cssText = 'display:flex;gap:16px;align-items:flex-start;margin-bottom:20px;';

    // Cover
    const cover = createInteractiveCover(
      pl.coverImgUrl,
      160,
      () => { /* preview */ },
      true
    );
    header.appendChild(cover);

    const info = document.createElement('div');
    info.innerHTML = `
      <h2 style="margin-bottom:8px;">${pl.name}</h2>
      <p style="color:var(--text-secondary);font-size:13px;margin-bottom:4px;">
        ${pl.creator?.nickname || ''} · ${pl.trackCount || 0} 首
      </p>
      <p style="color:var(--text-muted);font-size:12px;line-height:1.5;max-height:60px;overflow:hidden;">
        ${pl.description || ''}
      </p>
      <button id="pl-play-all" style="margin-top:12px;padding:8px 24px;background:var(--accent);color:white;border:none;border-radius:24px;font-size:14px;cursor:pointer;">
        ▶ 播放全部
      </button>
    `;
    header.appendChild(info);
    container.appendChild(header);

    // Tracks
    api.playlistTrackAll(id).then((trackRes) => {
      const tracks: Track[] = (trackRes.songs || []).map((s: any) => ({
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

      document.getElementById('pl-play-all')?.addEventListener('click', () => {
        if (tracks.length > 0) {
          playTrack(tracks[0], tracks);
        }
      });
    }).catch(() => {
      container.appendChild(document.createTextNode('加载歌曲失败'));
    });
  }).catch(() => {
    container.innerHTML = '<p class="text-muted">加载歌单失败</p>';
  });
}
