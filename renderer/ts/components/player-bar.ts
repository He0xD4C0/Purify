// Bottom player bar — always visible, placeholder when idle, click to open player overlay

import { bus } from '../core/event-bus.js';
import { state, formatTime, type Track } from '../core/app.js';
import { audioEngine } from '../player/audio-engine.js';
import { renderBadge, detectStatus } from './music-badge.js';

// ---- SVG icons (24x24 viewBox) ----
const SVG = {
  note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7.5 4.5c-.3-.2-.7-.2-1-.1-.3.1-.5.4-.5.8v13.6c0 .4.2.7.5.8.3.1.7.1 1-.1l11.5-6.8c.3-.2.5-.5.5-.8s-.2-.6-.5-.8L7.5 4.5z" stroke-linejoin="round"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="4" width="5" height="16" rx="1.5"/><rect x="14" y="4" width="5" height="16" rx="1.5"/></svg>',
  prev: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 5v14L9 12z"/><path d="M9 5v14H6V5z"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5v14l9-7z"/><path d="M15 5v14h3V5z"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 00-7.8 7.8L12 21l8.9-8.9a5.5 5.5 0 000-7.8z"/></svg>',
  list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>',
  random: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>',
  single: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/><text x="8" y="16" font-size="8" fill="currentColor" stroke="none" font-weight="bold">1</text></svg>',
};

const MODE_ICONS: Record<string, string> = { list: SVG.list, random: SVG.random, single: SVG.single };

export function initPlayerBar(): void {
  const bar = document.getElementById('player-bar');
  if (!bar) return;

  // ---- Build UI ----
  bar.innerHTML = `
    <div class="pb-progress-wrap">
      <div class="pb-progress-track">
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
      <button class="pb-btn" data-action="like" title="喜欢">${SVG.heart}</button>
      <button class="pb-btn" data-action="prev" title="上一首">${SVG.prev}</button>
      <button class="pb-btn play-btn" data-action="play" title="播放/暂停">${SVG.play}</button>
      <button class="pb-btn" data-action="next" title="下一首">${SVG.next}</button>
      <button class="pb-btn" data-action="mode" title="列表循环">${SVG.list}</button>
    </div>
    <span class="pb-time">--:-- / --:--</span>
  `;

  // ---- Cache DOM ----
  const wrap = bar.querySelector('.pb-progress-wrap') as HTMLElement;
  const track = bar.querySelector('.pb-progress-track') as HTMLElement;
  const fill = bar.querySelector('.pb-progress-fill') as HTMLElement;
  const thumb = bar.querySelector('.pb-progress-thumb') as HTMLElement;
  const timeEl = bar.querySelector('.pb-time') as HTMLElement;
  const playBtn = bar.querySelector('.pb-btn.play-btn') as HTMLButtonElement;
  const prevBtn = bar.querySelector('[data-action="prev"]') as HTMLButtonElement;
  const nextBtn = bar.querySelector('[data-action="next"]') as HTMLButtonElement;
  const likeBtn = bar.querySelector('[data-action="like"]') as HTMLButtonElement;
  const modeBtn = bar.querySelector('[data-action="mode"]') as HTMLButtonElement;
  const coverEl = bar.querySelector('.pb-cover') as HTMLElement;
  const infoEl = bar.querySelector('.pb-info') as HTMLElement;
  const badgeWrap = bar.querySelector('.pb-badge') as HTMLElement;
  const titleEl = bar.querySelector('.pb-title') as HTMLElement;
  const artistEl = bar.querySelector('.pb-artist') as HTMLElement;

  const ctrlBtns = [likeBtn, prevBtn, playBtn, nextBtn, modeBtn];

  // ---- Progress bar: click + drag ----
  function pctFromClientX(x: number): number {
    const rect = track.getBoundingClientRect();
    return Math.max(0, Math.min(1, (x - rect.left) / rect.width));
  }

  function doSeek(x: number): void {
    if (!state.currentTrack) return;
    const time = pctFromClientX(x) * (state.currentTrack.duration / 1000);
    audioEngine.seekTo(time);
  }

  // Click to seek
  track.addEventListener('click', (e: MouseEvent) => {
    if (!state.currentTrack) return;
    doSeek(e.clientX);
  });

  // Drag to seek — pointer capture for reliable tracking
  track.addEventListener('pointerdown', (e: PointerEvent) => {
    if (!state.currentTrack) return;
    e.preventDefault();
    track.setPointerCapture(e.pointerId);
    wrap.classList.add('dragging');
    doSeek(e.clientX);
  });

  track.addEventListener('pointermove', (e: PointerEvent) => {
    if (!track.hasPointerCapture(e.pointerId)) return;
    doSeek(e.clientX);
  });

  const endDrag = (e: PointerEvent) => {
    if (!track.hasPointerCapture(e.pointerId)) return;
    track.releasePointerCapture(e.pointerId);
    wrap.classList.remove('dragging');
  };
  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);

  // ---- Controls — direct call to audioEngine (no event bus) ----
  playBtn.addEventListener('click', (e) => { e.stopPropagation(); audioEngine.togglePlay(); });
  prevBtn.addEventListener('click', (e) => { e.stopPropagation(); audioEngine.playPrev(); });
  nextBtn.addEventListener('click', (e) => { e.stopPropagation(); audioEngine.playNext(); });
  likeBtn.addEventListener('click', (e) => { e.stopPropagation(); bus.emit('player:like-toggle'); });
  modeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const modes: Array<'list' | 'random' | 'single'> = ['list', 'random', 'single'];
    const idx = modes.indexOf(state.playMode);
    state.playMode = modes[(idx + 1) % modes.length];
    updateMode();
  });

  // ---- Open player overlay ----
  coverEl.addEventListener('click', () => bus.emit('player:open-overlay'));
  infoEl.addEventListener('click', () => bus.emit('player:open-overlay'));

  // ---- State updaters ----
  function updateTrack(track: Track | null): void {
    if (!track) { placeholder(); return; }

    ctrlBtns.forEach((b) => (b.disabled = false));
    bar.classList.remove('placeholder');

    // Cover
    const picUrl = track.album.picUrl ? `${track.album.picUrl}?param=90y90` : '';
    coverEl.innerHTML = `<img src="${picUrl}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;">`;

    titleEl.textContent = track.name;
    artistEl.textContent = track.artists.map((a) => a.name).join('/');

    badgeWrap.innerHTML = '';
    const status = detectStatus(track.fee || 0, track.privilege);
    badgeWrap.appendChild(renderBadge(status));
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

  function placeholder(): void {
    bar.classList.add('placeholder');
    ctrlBtns.forEach((b) => (b.disabled = true));
    fill.style.width = '0%';
    thumb.style.left = '0%';
    timeEl.textContent = '--:-- / --:--';
    coverEl.innerHTML = SVG.note;
    titleEl.textContent = '未在播放';
    artistEl.textContent = '点击此处打开播放器';
    badgeWrap.innerHTML = '';
    playBtn.innerHTML = SVG.play;
  }

  // ---- Listen for state changes ----
  bus.on('player:track-change', (track: Track) => updateTrack(track));
  bus.on('player:time-update', (time: number) => updateTime(time));
  bus.on('player:state-change', (playing: boolean) => updatePlayState(playing));

  // Init
  placeholder();
  updateMode();
}
