// Bottom player bar — always visible, placeholder when idle, click to open player overlay

import { bus } from '../core/event-bus.js';
import { state, formatTime, type Track } from '../core/app.js';
import { renderBadge, detectStatus } from './music-badge.js';

// ---- SVG icons (24x24 viewBox) ----
const SVG = {
  note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
  // Play — rounded triangle
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7.5 4.5c-.3-.2-.7-.2-1-.1-.3.1-.5.4-.5.8v13.6c0 .4.2.7.5.8.3.1.7.1 1-.1l11.5-6.8c.3-.2.5-.5.5-.8s-.2-.6-.5-.8L7.5 4.5z" stroke-linejoin="round"/></svg>',
  // Pause — two rounded rects
  pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="4" width="5" height="16" rx="1.5"/><rect x="14" y="4" width="5" height="16" rx="1.5"/></svg>',
  // Previous — two left-pointing triangles
  prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="20,5 11,12 20,19" fill="currentColor" stroke="none"/><polygon points="11,5 2,12 11,19" fill="currentColor" stroke="none"/></svg>',
  // Next — two right-pointing triangles
  next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="4,5 13,12 4,19" fill="currentColor" stroke="none"/><polygon points="13,5 22,12 13,19" fill="currentColor" stroke="none"/></svg>',
  // Heart outline
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 00-7.8 7.8L12 21l8.9-8.9a5.5 5.5 0 000-7.8z"/></svg>',
  // List loop
  list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>',
  // Random shuffle
  random: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>',
  // Single repeat
  single: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/><text x="8" y="16" font-size="8" fill="currentColor" stroke="none" font-weight="bold">1</text></svg>',
};

const MODE_ICONS: Record<string, string> = { list: SVG.list, random: SVG.random, single: SVG.single };

export function initPlayerBar(): void {
  const bar = document.getElementById('player-bar');
  if (!bar) return;

  // Build bar UI once
  bar.innerHTML = `
    <div class="pb-progress-wrap">
      <div class="pb-progress-track" data-action="seek-track">
        <div class="pb-progress-fill"></div>
        <div class="pb-progress-thumb"></div>
      </div>
    </div>
    <div class="pb-cover">${SVG.note}</div>
    <div class="pb-info">
      <div class="pb-title">未在播放</div>
      <div class="pb-artist">点击此处打开播放器</div>
    </div>
    <span class="pb-badge"></span>
    <div class="pb-controls">
      <button class="pb-btn" data-action="like" title="喜欢" disabled>${SVG.heart}</button>
      <button class="pb-btn" data-action="prev" title="上一首" disabled>${SVG.prev}</button>
      <button class="pb-btn play-btn" data-action="play" title="播放/暂停" disabled>${SVG.play}</button>
      <button class="pb-btn" data-action="next" title="下一首" disabled>${SVG.next}</button>
      <button class="pb-btn" data-action="mode" title="列表循环" disabled>${SVG.list}</button>
    </div>
    <span class="pb-time">--:-- / --:--</span>
  `;

  // Cache DOM refs
  const track = bar.querySelector('.pb-progress-track') as HTMLElement;
  const fill = bar.querySelector('.pb-progress-fill') as HTMLElement;
  const thumb = bar.querySelector('.pb-progress-thumb') as HTMLElement;
  const timeEl = bar.querySelector('.pb-time') as HTMLElement;
  const playBtn = bar.querySelector('.pb-btn.play-btn') as HTMLElement;
  const modeBtn = bar.querySelector('[data-action="mode"]') as HTMLElement;

  // Set initial placeholder
  setPlaceholder(true);

  // ============== Progress bar — click to seek ==============
  track.addEventListener('click', (e: MouseEvent) => {
    if (!state.currentTrack) return;
    const rect = track.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const time = pct * (state.currentTrack.duration / 1000);
    bus.emit('player:seek-to', time);
  });

  // ============== Event handlers ==============
  function updateTrack(track: Track | null): void {
    if (!track) {
      setPlaceholder(true);
      return;
    }
    setPlaceholder(false);

    // Cover
    const cover = bar!.querySelector('.pb-cover');
    if (cover) {
      const picUrl = track.album.picUrl ? `${track.album.picUrl}?param=90y90` : '';
      cover.innerHTML = `<img src="${picUrl}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;">`;
    }

    bar!.querySelector('.pb-title')!.textContent = track.name;
    bar!.querySelector('.pb-artist')!.textContent = track.artists.map((a) => a.name).join('/');

    const badgeWrap = bar!.querySelector('.pb-badge');
    if (badgeWrap) {
      badgeWrap.innerHTML = '';
      const status = detectStatus(track.fee || 0, track.privilege);
      badgeWrap.appendChild(renderBadge(status));
    }
  }

  function updateTime(time: number): void {
    if (!state.currentTrack) return;
    const dur = state.currentTrack.duration / 1000;
    if (dur <= 0) return;

    const pct = Math.min(time / dur, 1) * 100;
    fill.style.width = `${pct}%`;
    thumb.style.left = `${pct}%`;
    timeEl.textContent = `${formatTime(time)} / ${formatTime(dur)}`;
  }

  function updatePlayState(playing: boolean): void {
    playBtn.innerHTML = playing ? SVG.pause : SVG.play;
  }

  function updateMode(): void {
    modeBtn.innerHTML = MODE_ICONS[state.playMode];
  }

  function setPlaceholder(empty: boolean): void {
    bar!.classList.toggle('placeholder', empty);

    bar!.querySelectorAll('.pb-btn[data-action]').forEach((btn) => {
      (btn as HTMLButtonElement).disabled = empty;
    });

    if (empty) {
      fill.style.width = '0%';
      thumb.style.left = '0%';
      timeEl.textContent = '--:-- / --:--';
      bar!.querySelector('.pb-cover')!.innerHTML = SVG.note;
      bar!.querySelector('.pb-title')!.textContent = '未在播放';
      bar!.querySelector('.pb-artist')!.textContent = '点击此处打开播放器';
      const badgeWrap = bar!.querySelector('.pb-badge');
      if (badgeWrap) badgeWrap.innerHTML = '';
      playBtn.innerHTML = SVG.play;
    }
  }

  bus.on('player:track-change', (track: Track) => updateTrack(track));
  bus.on('player:time-update', (time: number) => updateTime(time));
  bus.on('player:state-change', (playing: boolean) => updatePlayState(playing));
  updateMode();

  // ---- Click to open player overlay ----
  bar.querySelector('.pb-cover')?.addEventListener('click', () => bus.emit('player:open-overlay'));
  bar.querySelector('.pb-info')?.addEventListener('click', () => bus.emit('player:open-overlay'));

  // ---- Action buttons ----
  playBtn.addEventListener('click', () => bus.emit('player:toggle'));
  bar.querySelector('[data-action="prev"]')?.addEventListener('click', () => bus.emit('player:prev'));
  bar.querySelector('[data-action="next"]')?.addEventListener('click', () => bus.emit('player:next'));
  modeBtn.addEventListener('click', () => {
    const modes = ['list', 'random', 'single'] as const;
    const idx = modes.indexOf(state.playMode);
    state.playMode = modes[(idx + 1) % modes.length];
    updateMode();
  });
}
