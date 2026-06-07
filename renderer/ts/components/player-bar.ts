// Bottom player bar — always visible, placeholder when idle, click to open player overlay

import { bus } from '../core/event-bus.js';
import { state, formatTime, type Track } from '../core/app.js';
import { audioEngine } from '../player/audio-engine.js';
import { renderBadge, detectStatus } from './music-badge.js';
import { SVG, MODE_ICONS } from './player-icons.js';

export function initPlayerBar(): void {
  const bar = document.getElementById('player-bar');
  if (!bar) return;
  const barEl = bar; // non-null ref for inner functions

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
    bar!.classList.remove('placeholder');

    // Cover
    const picUrl = track.album.picUrl ? `${track.album.picUrl}?param=90y90` : '';
    coverEl.innerHTML = `<img src="${picUrl}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;">`;

    titleEl.textContent = track.name;
    artistEl.textContent = track.artists.map((a) => a.name).join('/');

    badgeWrap.innerHTML = '';
    const status = detectStatus(track.fee || 0, track.privilege);
    const b = renderBadge(status);
    if (b) badgeWrap.appendChild(b);
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
    bar!.classList.add('placeholder');
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
