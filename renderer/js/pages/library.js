// Library page — my likes, my playlists, recent plays
import { router } from '../core/router.js';
import { state, playTrack } from '../core/app.js';
import { api } from '../core/api.js';
import { renderPlaylistGrid } from '../components/playlist-card.js';
import { renderSongList } from '../components/song-list.js';
import { renderLoginPanel } from '../components/login-panel.js';
export function renderLibrary(container) {
    container.innerHTML = '';
    if (!state.loggedIn) {
        container.innerHTML = `
      <div class="login-prompt">
        <h2>📚 我的曲库</h2>
        <p>登录后查看我的音乐</p>
        <button class="btn-login-prompt">立即登录</button>
      </div>
    `;
        container.querySelector('.btn-login-prompt')?.addEventListener('click', () => {
            const c = document.getElementById('content');
            if (c)
                renderLoginPanel(c);
        });
        return;
    }
    container.innerHTML = `
    <div id="lib-liked"></div>
    <div class="section-header mt-4"><h2>我的歌单</h2></div>
    <div id="lib-playlists" class="scroll-h"></div>
    <div class="section-header mt-4"><h2>最近播放</h2></div>
    <div id="lib-recent"></div>
  `;
    loadLiked();
    loadMyPlaylists();
    loadRecent();
}
async function loadLiked() {
    const section = document.getElementById('lib-liked');
    if (!section)
        return;
    try {
        const res = await api.likelist(String(state.userProfile?.userId || ''));
        const ids = res.ids || [];
        if (ids.length > 0) {
            // Get first few liked song details
            const songIds = ids.slice(0, 20).join(',');
            const detail = await api.songDetail(songIds);
            const songs = detail.songs || [];
            section.innerHTML = `
        <div class="section-header">
          <h2>❤️ 我喜欢</h2>
          <span class="text-muted text-sm">${ids.length} 首</span>
        </div>
      `;
            const listWrap = document.createElement('div');
            section.appendChild(listWrap);
            renderSongList(songs.map(mapBasicTrack).slice(0, 10), {
                container: listWrap,
                onPlay: (_, i) => playTrack(mapBasicTrack(songs[i]), songs.map(mapBasicTrack)),
            });
        }
    }
    catch {
        // silently fail
    }
}
async function loadMyPlaylists() {
    const section = document.getElementById('lib-playlists');
    if (!section)
        return;
    try {
        const res = await api.userPlaylist(String(state.userProfile?.userId || ''));
        const playlists = (res.playlist || []).filter((p) => p.userId === state.userProfile?.userId);
        renderPlaylistGrid(section, playlists, (pl) => {
            router.navigate(`playlist/${pl.id}`);
        });
    }
    catch {
        // silently fail
    }
}
async function loadRecent() {
    const section = document.getElementById('lib-recent');
    if (!section)
        return;
    try {
        const res = await api.recentListenList();
        const list = res.data?.list || [];
        if (list.length > 0) {
            const listWrap = document.createElement('div');
            section.appendChild(listWrap);
            renderSongList(list.map((item) => mapBasicTrack(item.data)).slice(0, 10), {
                container: listWrap,
                onPlay: (_, i) => playTrack(mapBasicTrack(list[i].data), list.map((item) => mapBasicTrack(item.data))),
            });
        }
    }
    catch {
        // silently fail
    }
}
function mapBasicTrack(raw) {
    return {
        id: raw.id,
        name: raw.name,
        artists: (raw.ar || raw.artists || []).map((a) => ({ id: a.id, name: a.name })),
        album: {
            id: raw.al?.id || raw.album?.id || 0,
            name: raw.al?.name || raw.album?.name || '',
            picUrl: raw.al?.picUrl || raw.album?.picUrl || '',
        },
        duration: raw.dt || raw.duration || 0,
        fee: raw.fee,
        privilege: raw.privilege,
    };
}
//# sourceMappingURL=library.js.map