// Bottom player bar — hidden when player page is open

import { bus } from '../core/event-bus.js';
import { state, formatTime, type Track } from '../core/app.js';
import { renderBadge, detectStatus } from './music-badge.js';

export function initPlayerBar(): void {
  const bar = document.getElementById('player-bar');
  if (!bar) return;

  function updateTrack(track: Track | null): void {
    if (!bar) return;
    if (!track) {
      bar.classList.remove('visible');
      return;
    }

    bar.classList.add('visible');

    const cover = bar.querySelector('.pb-cover') as HTMLImageElement;
    if (cover) {
      cover.src = track.album.picUrl ? `${track.album.picUrl}?param=90y90` : '';
    }

    // Info
    const title = bar.querySelector('.pb-title');
    if (title) title.textContent = track.name;
    const artist = bar.querySelector('.pb-artist');
    if (artist) artist.textContent = track.artists.map((a) => a.name).join('/');

    // Badge
    const badgeWrap = bar.querySelector('.pb-badge');
    if (badgeWrap) {
      badgeWrap.innerHTML = '';
      const status = detectStatus(track.fee || 0, track.privilege);
      badgeWrap.appendChild(renderBadge(status));
    }
  }

  function updateTime(time: number): void {
    const timeEl = bar?.querySelector('.pb-time');
    if (timeEl && state.currentTrack) {
      const total = formatTime(state.currentTrack.duration / 1000);
      timeEl.textContent = `${formatTime(time)} / ${total}`;
    }

    const progress = bar?.querySelector('.pb-progress') as HTMLElement;
    if (progress && state.currentTrack) {
      const pct = (time / (state.currentTrack.duration / 1000)) * 100;
      progress.style.width = `${Math.min(pct, 100)}%`;
    }
  }

  function updatePlayState(playing: boolean): void {
    const playBtn = bar?.querySelector('.pb-btn.play-btn');
    if (playBtn) playBtn.textContent = playing ? '⏸' : '▶';
  }

  bus.on('player:track-change', (track: Track) => updateTrack(track));
  bus.on('player:time-update', (time: number) => updateTime(time));
  bus.on('player:state-change', (playing: boolean) => updatePlayState(playing));

  // Build bar UI
  bar.innerHTML = `
    <div class="pb-progress"></div>
    <img class="pb-cover" src="" alt="">
    <div class="pb-info">
      <div class="pb-title"></div>
      <div class="pb-artist"></div>
    </div>
    <span class="pb-badge"></span>
    <div class="pb-controls">
      <button class="pb-btn" data-action="like" title="喜欢">♡</button>
      <button class="pb-btn" data-action="prev" title="上一首">⏮</button>
      <button class="pb-btn play-btn" data-action="play" title="播放/暂停">▶</button>
      <button class="pb-btn" data-action="next" title="下一首">⏭</button>
      <button class="pb-btn" data-action="mode" title="播放模式">🔁</button>
    </div>
    <span class="pb-time">--:-- / --:--</span>
  `;

  // Event handlers
  bar.querySelector('.pb-cover')?.addEventListener('click', () => {
    bus.emit('nav:page', 'player');
  });
  bar.querySelector('.pb-info')?.addEventListener('click', () => {
    bus.emit('nav:page', 'player');
  });
  bar.querySelector('[data-action="play"]')?.addEventListener('click', () => {
    bus.emit('player:toggle');
  });
  bar.querySelector('[data-action="prev"]')?.addEventListener('click', () => {
    bus.emit('player:prev');
  });
  bar.querySelector('[data-action="next"]')?.addEventListener('click', () => {
    bus.emit('player:next');
  });
  bar.querySelector('[data-action="mode"]')?.addEventListener('click', () => {
    const modes = ['list', 'random', 'single'] as const;
    const idx = modes.indexOf(state.playMode);
    state.playMode = modes[(idx + 1) % modes.length];
    const btn = bar.querySelector('[data-action="mode"]');
    if (btn) {
      const icons: Record<string, string> = { list: '🔁', random: '🔀', single: '🔂' };
      btn.textContent = icons[state.playMode];
    }
  });
}
