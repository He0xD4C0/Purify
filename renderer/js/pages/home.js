// Home / Discovery page — search bar at top, banner, personalized, daily recs
import { router } from '../core/router.js';
import { state, playTrack } from '../core/app.js';
import { api } from '../core/api.js';
import { SwipeBanner } from '../patterns/swipe-banner.js';
import { renderPlaylistGrid } from '../components/playlist-card.js';
import { renderSongList } from '../components/song-list.js';
import { bus } from '../core/event-bus.js';
let banner;
export function renderHome(container) {
    container.innerHTML = '';
    container.className = 'home-page';
    // 1. Banner
    const bannerWrap = document.createElement('div');
    bannerWrap.id = 'home-banner';
    container.appendChild(bannerWrap);
    banner = new SwipeBanner(bannerWrap);
    // 3. Dragon Ball / Daily Recs
    const dailySection = document.createElement('div');
    dailySection.id = 'home-daily';
    dailySection.innerHTML = '<div class="section-header"><h2>每日推荐</h2></div>';
    container.appendChild(dailySection);
    // 4. Personalized playlists
    const persSection = document.createElement('div');
    persSection.id = 'home-personalized';
    persSection.innerHTML = '<div class="section-header"><h2>推荐歌单</h2></div>';
    const persGrid = document.createElement('div');
    persGrid.className = 'scroll-h';
    persSection.appendChild(persGrid);
    container.appendChild(persSection);
    // 5. New songs
    const newsSection = document.createElement('div');
    newsSection.id = 'home-newsongs';
    newsSection.innerHTML = '<div class="section-header"><h2>新歌推荐</h2></div>';
    container.appendChild(newsSection);
    // Load data
    loadBanner();
    loadDaily();
    loadPersonalized(persGrid);
    loadNewSongs(newsSection);
}
async function loadBanner() {
    try {
        const res = await api.banner(0);
        if (res.banners) {
            banner.setItems(res.banners.map((b) => ({
                imageUrl: b.pic || b.imageUrl,
                url: b.url,
                typeTitle: b.typeTitle,
            })));
        }
    }
    catch (e) {
        console.warn('Banner load failed:', e);
    }
}
async function loadDaily() {
    const section = document.getElementById('home-daily');
    if (!section)
        return;
    if (!state.loggedIn) {
        section.innerHTML += `
      <div class="login-prompt">
        <p>登录后获取每日推荐</p>
        <button class="btn-login-prompt">立即登录</button>
      </div>
    `;
        section.querySelector('.btn-login-prompt')?.addEventListener('click', () => {
            bus.emit('auth:require-login');
        });
        return;
    }
    try {
        const res = await api.recommendSongs();
        const tracks = res.data?.dailySongs || [];
        if (tracks.length > 0) {
            const listWrap = document.createElement('div');
            listWrap.className = 'song-list-wrap';
            section.appendChild(listWrap);
            renderSongList(tracks.map(mapTrack).slice(0, 10), {
                container: listWrap,
                onPlay: (_, i) => {
                    const t = tracks[i];
                    playTrack(mapTrack(t), tracks.map(mapTrack));
                },
            });
        }
    }
    catch {
        section.innerHTML += '<p class="text-muted text-sm">加载失败</p>';
    }
}
async function loadPersonalized(container) {
    try {
        const res = await api.personalized(12);
        const playlists = res.result || [];
        renderPlaylistGrid(container, playlists, (pl) => {
            router.navigate(`playlist/${pl.id}`);
        });
    }
    catch {
        container.innerHTML = '<p class="text-muted text-sm">加载失败</p>';
    }
}
async function loadNewSongs(container) {
    try {
        const res = await api.personalizedNewsong(10);
        const songs = res.result || [];
        if (songs.length > 0) {
            const listWrap = document.createElement('div');
            container.appendChild(listWrap);
            renderSongList(songs.map((s) => ({
                id: s.id,
                name: s.name,
                artists: (s.song?.artists || s.artists || []).map((a) => ({ id: a.id, name: a.name })),
                album: { id: s.song?.album?.id || s.album?.id || 0, name: s.song?.album?.name || s.album?.name || '', picUrl: s.picUrl || s.song?.album?.picUrl || '' },
                duration: s.song?.duration || s.duration || 0,
                fee: s.song?.fee || s.fee,
                privilege: s.song?.privilege || s.privilege,
            })), {
                container: listWrap,
                onPlay: (track, i) => {
                    playTrack(track, songs.map((s) => ({
                        id: s.id,
                        name: s.name,
                        artists: (s.song?.artists || s.artists || []).map((a) => ({ id: a.id, name: a.name })),
                        album: { id: s.song?.album?.id || 0, name: s.song?.album?.name || '', picUrl: s.picUrl || '' },
                        duration: s.song?.duration || s.duration || 0,
                        fee: s.song?.fee || s.fee,
                        privilege: s.song?.privilege || s.privilege,
                    })));
                },
            });
        }
    }
    catch {
        // silently fail
    }
}
function mapTrack(raw) {
    return {
        id: raw.id,
        name: raw.name,
        artists: (raw.ar || raw.artists || []).map((a) => ({ id: a.id, name: a.name })),
        album: {
            id: raw.al?.id || raw.album?.id || 0,
            name: raw.al?.name || raw.album?.name || '',
            picUrl: raw.al?.picUrl || raw.album?.picUrl || raw.album?.coverImgUrl || '',
        },
        duration: raw.dt || raw.duration || 0,
        fee: raw.fee,
        privilege: raw.privilege,
    };
}
//# sourceMappingURL=home.js.map