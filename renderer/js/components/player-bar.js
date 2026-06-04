// Bottom player bar — always visible, placeholder when idle, click to open player overlay
import { bus } from '../core/event-bus.js';
import { state, formatTime } from '../core/app.js';
import { renderBadge, detectStatus } from './music-badge.js';
export function initPlayerBar() {
    const bar = document.getElementById('player-bar');
    if (!bar)
        return;
    // SVG placeholder icon — simple music note
    const PLACEHOLDER_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';
    // Build bar UI once
    bar.innerHTML = `
    <div class="pb-progress"></div>
    <div class="pb-cover">${PLACEHOLDER_SVG}</div>
    <div class="pb-info">
      <div class="pb-title">未在播放</div>
      <div class="pb-artist">点击此处打开播放器</div>
    </div>
    <span class="pb-badge"></span>
    <div class="pb-controls">
      <button class="pb-btn" data-action="like" title="喜欢" disabled>♡</button>
      <button class="pb-btn" data-action="prev" title="上一首" disabled>⏮</button>
      <button class="pb-btn play-btn" data-action="play" title="播放/暂停" disabled>▶</button>
      <button class="pb-btn" data-action="next" title="下一首" disabled>⏭</button>
      <button class="pb-btn" data-action="mode" title="播放模式" disabled>🔁</button>
    </div>
    <span class="pb-time">--:-- / --:--</span>
  `;
    // Set initial placeholder state
    setPlaceholder(true);
    // ---- Event: track changes ----
    function updateTrack(track) {
        if (!track) {
            setPlaceholder(true);
            return;
        }
        setPlaceholder(false);
        // Replace placeholder SVG with actual cover image
        const cover = bar.querySelector('.pb-cover');
        if (cover) {
            const picUrl = track.album.picUrl ? `${track.album.picUrl}?param=90y90` : '';
            cover.innerHTML = `<img src="${picUrl}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;">`;
        }
        const title = bar.querySelector('.pb-title');
        if (title)
            title.textContent = track.name;
        const artist = bar.querySelector('.pb-artist');
        if (artist)
            artist.textContent = track.artists.map((a) => a.name).join('/');
        const badgeWrap = bar.querySelector('.pb-badge');
        if (badgeWrap) {
            badgeWrap.innerHTML = '';
            const status = detectStatus(track.fee || 0, track.privilege);
            badgeWrap.appendChild(renderBadge(status));
        }
    }
    function updateTime(time) {
        const timeEl = bar?.querySelector('.pb-time');
        if (timeEl && state.currentTrack) {
            const total = formatTime(state.currentTrack.duration / 1000);
            timeEl.textContent = `${formatTime(time)} / ${total}`;
        }
        const progress = bar?.querySelector('.pb-progress');
        if (progress && state.currentTrack) {
            const pct = (time / (state.currentTrack.duration / 1000)) * 100;
            progress.style.width = `${Math.min(pct, 100)}%`;
        }
    }
    function updatePlayState(playing) {
        const playBtn = bar?.querySelector('.pb-btn.play-btn');
        if (playBtn)
            playBtn.textContent = playing ? '⏸' : '▶';
    }
    function setPlaceholder(empty) {
        bar.classList.toggle('placeholder', empty);
        const disabled = bar.querySelectorAll('.pb-btn[data-action]');
        disabled.forEach((btn) => {
            btn.disabled = empty;
        });
        if (empty) {
            const cover = bar.querySelector('.pb-cover');
            if (cover)
                cover.innerHTML = PLACEHOLDER_SVG;
            const title = bar.querySelector('.pb-title');
            if (title)
                title.textContent = '未在播放';
            const artist = bar.querySelector('.pb-artist');
            if (artist)
                artist.textContent = '点击此处打开播放器';
            const badgeWrap = bar.querySelector('.pb-badge');
            if (badgeWrap)
                badgeWrap.innerHTML = '';
            const progress = bar.querySelector('.pb-progress');
            if (progress)
                progress.style.width = '0%';
            const timeEl = bar.querySelector('.pb-time');
            if (timeEl)
                timeEl.textContent = '--:-- / --:--';
        }
    }
    bus.on('player:track-change', (track) => updateTrack(track));
    bus.on('player:time-update', (time) => updateTime(time));
    bus.on('player:state-change', (playing) => updatePlayState(playing));
    // ---- Click to open player overlay ----
    bar.querySelector('.pb-cover')?.addEventListener('click', () => {
        bus.emit('player:open-overlay');
    });
    bar.querySelector('.pb-info')?.addEventListener('click', () => {
        bus.emit('player:open-overlay');
    });
    // ---- Action buttons ----
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
        const modes = ['list', 'random', 'single'];
        const idx = modes.indexOf(state.playMode);
        state.playMode = modes[(idx + 1) % modes.length];
        const btn = bar.querySelector('[data-action="mode"]');
        if (btn) {
            const icons = { list: '🔁', random: '🔀', single: '🔂' };
            btn.textContent = icons[state.playMode];
        }
    });
}
//# sourceMappingURL=player-bar.js.map