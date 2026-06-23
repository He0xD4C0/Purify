// Home / Discovery page — search bar at top, banner, personalized, daily recs

import { router } from '../core/router.js';
import { state, playTrack, type Track } from '../core/app.js';
import { api } from '../core/api.js';
import { SwipeBanner } from '../patterns/swipe-banner.js';
import { renderPlaylistGrid, type PlaylistInfo } from '../components/playlist-card.js';
import { renderSongList } from '../components/song-list.js';
import { createCover } from '../components/cover.js';
import { bus } from '../core/event-bus.js';

let banner: SwipeBanner;

export function renderHome(container: HTMLElement): void {
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

async function loadBanner(): Promise<void> {
  try {
    const res = await api.banner(0);
    if (res.banners) {
      banner.setItems(res.banners.map((b: any) => ({
        imageUrl: b.pic || b.imageUrl,
        url: b.url,
        typeTitle: b.typeTitle,
      })));
    }
  } catch (e) {
    console.warn('Banner load failed:', e);
  }
}

async function loadDaily(): Promise<void> {
  const section = document.getElementById('home-daily');
  if (!section) return;

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
      const mapped = tracks.map(mapTrack);
      const cols = buildDailyColumns(mapped.slice(0, 27)); // 3 cards × 9 cols max
      const grid = document.createElement('div');
      grid.className = 'daily-grid';
      cols.forEach((col) => grid.appendChild(col));
      section.appendChild(grid);
      // 标记溢出文本，生成动态滚动动画
      requestAnimationFrame(() => {
        grid.querySelectorAll('.marquee-text').forEach((el) => {
          const parent = el.parentElement;
          if (!parent) return;
          const textW = (el as HTMLElement).scrollWidth;
          const boxW = parent.clientWidth;
          if (textW > boxW) {
            el.classList.add('overflow');
            // 动态 keyframes: 停顿 → 向左滑出 → 从右侧滑入 → 停顿
            const totalDist = textW + boxW; // 完整滚动距离（左滑出 + 右滑入）
            const speed = 38; // px/s
            const duration = totalDist / speed;
            const pauseEnd = 20; // 首尾各停顿 20%
            const scrollOut = Math.round((textW / totalDist) * (100 - pauseEnd * 2));
            const jump = scrollOut + pauseEnd + 0.1; // 跳跃点(不可见)
            const scrollIn = 100 - pauseEnd;
            const name = `marquee-${Math.random().toString(36).slice(2, 8)}`;
            const sheet = document.styleSheets[0];
            sheet.insertRule(`@keyframes ${name} {
              0%, ${pauseEnd}% { transform: translateX(0); }
              ${scrollOut + pauseEnd}% { transform: translateX(-${textW}px); }
              ${jump}% { transform: translateX(${boxW}px); }
              ${scrollIn}%, 100% { transform: translateX(0); }
            }`, sheet.cssRules.length);
            (el as HTMLElement).style.animation = `${name} ${duration}s linear infinite`;
          }
        });
      });
    }
  } catch {
    section.innerHTML += '<p class="text-muted text-sm">加载失败</p>';
  }
}

async function loadPersonalized(container: HTMLElement): Promise<void> {
  try {
    const res = await api.personalized(12);
    const playlists: PlaylistInfo[] = res.result || [];
    renderPlaylistGrid(container, playlists, (pl) => {
      router.navigate(`playlist/${pl.id}`);
    });
  } catch {
    container.innerHTML = '<p class="text-muted text-sm">加载失败</p>';
  }
}

async function loadNewSongs(container: HTMLElement): Promise<void> {
  const loadingEl = document.createElement('p');
  loadingEl.className = 'text-muted text-sm';
  loadingEl.style.padding = '8px 0';
  loadingEl.textContent = '加载中...';
  container.appendChild(loadingEl);

  try {
    const res = await api.personalizedNewsong(10);
    const songs = res.result || [];
    loadingEl.remove();
    if (songs.length > 0) {
      const listWrap = document.createElement('div');
      container.appendChild(listWrap);
      renderSongList(songs.map((s: any) => ({
        id: s.id,
        name: s.name,
        artists: (s.song?.artists || s.artists || []).map((a: any) => ({ id: a.id, name: a.name })),
        album: { id: s.song?.album?.id || s.album?.id || 0, name: s.song?.album?.name || s.album?.name || '', picUrl: s.picUrl || s.song?.album?.picUrl || '' },
        duration: s.song?.duration || s.duration || 0,
        fee: s.song?.fee || s.fee,
        privilege: s.song?.privilege || s.privilege,
      })), {
        container: listWrap,
        onPlay: (track, i) => {
          playTrack(track as unknown as Track, songs.map((s: any) => ({
            id: s.id,
            name: s.name,
            artists: (s.song?.artists || s.artists || []).map((a: any) => ({ id: a.id, name: a.name })),
            album: { id: s.song?.album?.id || 0, name: s.song?.album?.name || '', picUrl: s.picUrl || '' },
            duration: s.song?.duration || s.duration || 0,
            fee: s.song?.fee || s.fee,
            privilege: s.song?.privilege || s.privilege,
          })) as unknown as Track[]);
        },
      });
    }
  } catch {
    loadingEl.remove();
  }
}

/** Build card columns for daily recs — max 3 cards per column, horizontal scroll */
function buildDailyColumns(tracks: Track[]): HTMLElement[] {
  const cols: HTMLElement[] = [];
  const perCol = 3;

  for (let i = 0; i < tracks.length; i += perCol) {
    const col = document.createElement('div');
    col.className = 'daily-col';

    for (let j = i; j < i + perCol && j < tracks.length; j++) {
      const t = tracks[j];
      const card = document.createElement('div');
      card.className = 'daily-card';

      const coverEl = createCover(t.album.picUrl || '', 60, {
        className: 'daily-cover',
        onClick: () => playTrack(t, tracks),
      });

      const info = document.createElement('div');
      info.className = 'daily-info';
      info.innerHTML = `
        <div class="daily-title"><span class="marquee-text">${t.name}</span></div>
        <div class="daily-artist"><span class="marquee-text">${t.artists.map((a) => a.name).join('/')}</span></div>
      `;

      card.appendChild(coverEl);
      card.appendChild(info);
      col.appendChild(card);
    }

    cols.push(col);
  }

  return cols;
}

function mapTrack(raw: any): Track {
  return {
    id: raw.id,
    name: raw.name,
    artists: (raw.ar || raw.artists || []).map((a: any) => ({ id: a.id, name: a.name })),
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
