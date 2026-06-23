// Playlist detail page — for browsing online playlists
import { playTrack } from '../core/app.js';
import { api } from '../core/api.js';
import { renderSongList } from '../components/song-list.js';
import { createInteractiveCover } from '../patterns/interactive-cover.js';
export function renderPlaylistDetail(container, id) {
    container.innerHTML = '<p class="text-muted">加载中...</p>';
    api.playlistDetail(id).then((res) => {
        const pl = res.playlist;
        if (!pl) {
            container.innerHTML = '<p class="text-muted">歌单不存在</p>';
            return;
        }
        container.innerHTML = '';
        // Header
        const header = document.createElement('div');
        header.className = 'pl-header';
        // Cover
        const cover = createInteractiveCover(pl.coverImgUrl, 160, () => { }, true);
        header.appendChild(cover);
        const info = document.createElement('div');
        info.className = 'pl-info';
        info.innerHTML = `
      <h2>${pl.name}</h2>
      <p class="pl-meta">
        ${pl.creator?.nickname || ''} · ${pl.trackCount || 0} 首
      </p>
      ${pl.description ? `<p class="pl-desc" id="pl-desc">${pl.description}</p>` : ''}
      <button id="pl-play-all" class="pl-play-all">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        播放全部
      </button>
    `;
        header.appendChild(info);
        container.appendChild(header);
        // Description expand/collapse
        const descEl = info.querySelector('#pl-desc');
        if (descEl) {
            descEl.addEventListener('click', () => {
                descEl.classList.toggle('expanded');
            });
        }
        // Tracks
        api.playlistTrackAll(id).then((trackRes) => {
            const tracks = (trackRes.songs || []).map((s) => ({
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
                privilege: s.privilege || s.priv,
            }));
            const listWrap = document.createElement('div');
            container.appendChild(listWrap);
            const songListTracks = tracks.map((t) => ({
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
//# sourceMappingURL=playlist.js.map