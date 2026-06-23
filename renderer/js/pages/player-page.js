// Full-screen player page — cover center, 3 panels, controls
import { bus } from '../core/event-bus.js';
import { state, formatTime } from '../core/app.js';
import { api } from '../core/api.js';
import { audioEngine } from '../player/audio-engine.js';
import { lyricsEngine } from '../player/lyrics-engine.js';
import { SVG } from '../components/player-icons.js';
let lyricsMode = 'bilingual';
export function renderPlayerPage() {
    const page = document.getElementById('player-page');
    if (!page)
        return;
    page.classList.remove('hidden');
    page.innerHTML = '';
    // Header
    const header = document.createElement('div');
    header.className = 'player-header';
    const backBtn = document.createElement('button');
    backBtn.className = 'ph-back';
    backBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><polyline points="6 9 12 15 18 9"/></svg>';
    backBtn.title = '收起';
    backBtn.addEventListener('click', () => {
        page.classList.add('hidden');
        bus.emit('player:page-close');
    });
    header.appendChild(backBtn);
    page.appendChild(header);
    // Body
    const body = document.createElement('div');
    body.className = 'player-body';
    // Left panel — metadata
    const leftPanel = createMetaPanel();
    body.appendChild(leftPanel);
    // Center cover — SVG placeholder when no track
    const coverCenter = document.createElement('div');
    coverCenter.className = 'player-cover-center';
    coverCenter.id = 'player-cover-center';
    coverCenter.innerHTML = `
    <div id="player-cover-placeholder" style="
      width:min(60vw,60vh,400px);height:min(60vw,60vh,400px);
      display:flex;align-items:center;justify-content:center;
      background:var(--bg-tertiary);border-radius:var(--radius-lg);
      color:var(--text-muted);box-shadow:0 8px 40px rgba(0,0,0,0.5);
    ">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" width="80" height="80">
        <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
      </svg>
    </div>`;
    body.appendChild(coverCenter);
    // Right panel — lyrics
    const rightPanel = createLyricsPanel();
    body.appendChild(rightPanel);
    page.appendChild(body);
    // Bottom panel — queue
    const bottomPanel = createQueuePanel();
    bottomPanel.className = 'player-panel bottom';
    page.appendChild(bottomPanel);
    // Progress
    const progress = document.createElement('div');
    progress.className = 'player-progress';
    progress.innerHTML = `
    <span class="pp-time" id="pp-current">0:00</span>
    <input type="range" class="pp-slider" id="pp-slider" min="0" max="100" value="0">
    <span class="pp-time" id="pp-total">0:00</span>
  `;
    page.appendChild(progress);
    // Controls
    const controls = document.createElement('div');
    controls.className = 'player-controls';
    controls.innerHTML = `
    <div class="ctrl-group left">
      <button class="pc-btn" data-action="metadata" title="元数据">${SVG.meta}</button>
      <button class="pc-btn" data-action="prev" title="上一首">${SVG.prev}</button>
    </div>
    <button class="pc-btn play-btn" data-action="play" title="播放/暂停">${state.playing ? SVG.pause : SVG.play}</button>
    <div class="ctrl-group right">
      <button class="pc-btn" data-action="next" title="下一首">${SVG.next}</button>
      <button class="pc-btn" data-action="mode" id="pc-mode-btn" title="播放模式">${SVG.list}</button>
      <button class="pc-btn" data-action="lyrics" title="歌词">${SVG.lyrics}</button>
      <button class="pc-btn" data-action="queue" title="队列">${SVG.queue}</button>
    </div>
  `;
    page.appendChild(controls);
    // Event bindings
    bindControls(page);
    bindEvents(page);
    // If currently playing, update UI
    if (state.currentTrack) {
        updateTrackDisplay(page, state.currentTrack);
    }
}
function createMetaPanel() {
    const panel = document.createElement('div');
    panel.className = 'player-panel left';
    panel.id = 'panel-meta';
    panel.innerHTML = `
    <div class="meta-section">
      <h3>歌曲信息</h3>
      <div id="meta-song"></div>
    </div>
    <div class="meta-section">
      <h3>专辑信息</h3>
      <div id="meta-album"></div>
    </div>
    <div class="meta-section">
      <h3>相似推荐</h3>
      <div id="meta-similar"></div>
    </div>
  `;
    return panel;
}
function createLyricsPanel() {
    const panel = document.createElement('div');
    panel.className = 'player-panel right';
    panel.id = 'panel-lyrics';
    const toolbar = document.createElement('div');
    toolbar.className = 'lyrics-toolbar';
    toolbar.innerHTML = `
    <button data-lyric-mode="original" class="${lyricsMode === 'original' ? 'active' : ''}">原文</button>
    <button data-lyric-mode="bilingual" class="${lyricsMode === 'bilingual' ? 'active' : ''}">双语</button>
    <button data-lyric-mode="ruby" class="${lyricsMode === 'ruby' ? 'active' : ''}">注音</button>
  `;
    panel.appendChild(toolbar);
    // Lyrics display area
    const display = document.createElement('div');
    display.className = 'lyrics-display';
    display.id = 'lyrics-display';
    panel.appendChild(display);
    // Mode switching
    toolbar.querySelectorAll('button').forEach((btn) => {
        btn.addEventListener('click', () => {
            lyricsMode = (btn.dataset.lyricMode || 'bilingual');
            toolbar.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            renderLyrics();
        });
    });
    return panel;
}
function createQueuePanel() {
    const panel = document.createElement('div');
    panel.classList.add('player-panel', 'bottom');
    panel.id = 'panel-queue';
    panel.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:0 4px 8px;">
      <span style="font-size:13px;color:var(--text-muted);">播放列表</span>
      <button id="queue-close-btn" style="background:none;border:none;color:var(--text-secondary);font-size:18px;cursor:pointer;" title="收起">×</button>
    </div>
    <div class="player-queue" id="player-queue"></div>
  `;
    panel.querySelector('#queue-close-btn')?.addEventListener('click', () => {
        panel.classList.remove('open');
    });
    return panel;
}
function bindControls(page) {
    // Play/Pause
    page.querySelector('[data-action="play"]')?.addEventListener('click', () => {
        audioEngine.togglePlay();
    });
    // Prev/Next
    page.querySelector('[data-action="prev"]')?.addEventListener('click', () => {
        audioEngine.playPrev();
    });
    page.querySelector('[data-action="next"]')?.addEventListener('click', () => {
        audioEngine.playNext();
    });
    // Mode
    const MODE_ICONS = { list: SVG.list, random: SVG.random, single: SVG.single };
    page.querySelector('[data-action="mode"]')?.addEventListener('click', function () {
        const modes = ['list', 'random', 'single'];
        const idx = modes.indexOf(state.playMode);
        state.playMode = modes[(idx + 1) % modes.length];
        this.innerHTML = MODE_ICONS[state.playMode];
    });
    // Panel toggles
    page.querySelector('[data-action="metadata"]')?.addEventListener('click', () => {
        togglePanel('panel-meta');
    });
    page.querySelector('[data-action="lyrics"]')?.addEventListener('click', () => {
        const panel = document.getElementById('panel-lyrics');
        const willOpen = panel && !panel.classList.contains('open');
        togglePanel('panel-lyrics');
        // Fetch lyrics on first open
        if (willOpen && state.currentTrack) {
            lyricsEngine.fetch(state.currentTrack.id).then(() => renderLyrics());
        }
    });
    page.querySelector('[data-action="queue"]')?.addEventListener('click', () => {
        togglePanel('panel-queue');
    });
    // Progress slider
    const slider = page.querySelector('#pp-slider');
    slider?.addEventListener('input', () => {
        const time = (parseInt(slider.value) / 100) * audioEngine.getDuration();
        audioEngine.seekTo(time);
    });
}
function togglePanel(id) {
    const panel = document.getElementById(id);
    if (!panel)
        return;
    panel.classList.toggle('open');
}
function bindEvents(page) {
    bus.on('player:track-change', (track) => updateTrackDisplay(page, track));
    bus.on('player:time-update', (time) => updateTimeDisplay(time));
    bus.on('player:state-change', (playing) => {
        const playBtn = page.querySelector('[data-action="play"]');
        if (playBtn)
            playBtn.innerHTML = playing ? SVG.pause : SVG.play;
    });
    bus.on('queue:changed', () => renderQueue());
}
function updateTrackDisplay(page, track) {
    // Cover — replace SVG placeholder with actual image
    const coverCenter = page.querySelector('#player-cover-center');
    if (coverCenter) {
        const picUrl = track.album.picUrl ? `${track.album.picUrl}?param=800y800` : '';
        coverCenter.innerHTML = `<img src="${picUrl}" alt="" style="width:min(60vw,60vh,400px);height:min(60vw,60vh,400px);border-radius:var(--radius-lg);object-fit:cover;box-shadow:0 8px 40px rgba(0,0,0,0.5);background:var(--bg-tertiary);">`;
    }
    // Total time
    const totalEl = page.querySelector('#pp-total');
    if (totalEl)
        totalEl.textContent = formatTime(track.duration / 1000);
    // Metadata
    const metaSong = document.getElementById('meta-song');
    if (metaSong) {
        metaSong.innerHTML = `
      <div class="meta-row"><span class="meta-label">歌曲</span>${track.name}</div>
      <div class="meta-row"><span class="meta-label">艺人</span>${track.artists.map(a => a.name).join('/')}</div>
      <div class="meta-row"><span class="meta-label">品质</span>${track.fee ? '付费' : '免费'}</div>
    `;
    }
    const metaAlbum = document.getElementById('meta-album');
    if (metaAlbum) {
        metaAlbum.innerHTML = `
      <div class="meta-row"><span class="meta-label">专辑</span>${track.album.name}</div>
    `;
    }
    // Load lyrics (only if panel is open)
    const lyricsPanel = document.getElementById('panel-lyrics');
    if (lyricsPanel?.classList.contains('open')) {
        lyricsEngine.fetch(track.id).then(() => renderLyrics());
    }
    // Load similar (lazy)
    loadSimilar(track.id);
    // Queue
    renderQueue();
}
function updateTimeDisplay(time) {
    const currentEl = document.getElementById('pp-current');
    if (currentEl)
        currentEl.textContent = formatTime(time);
    const slider = document.getElementById('pp-slider');
    if (slider && state.currentTrack) {
        const dur = state.currentTrack.duration / 1000;
        if (dur > 0) {
            slider.value = String((time / dur) * 100);
        }
    }
    // Highlight current lyric line
    highlightLyricLine(time);
}
// ---- Lyrics rendering ----
let currentLyricLines = [];
function renderLyrics() {
    const display = document.getElementById('lyrics-display');
    if (!display)
        return;
    const lyric = lyricsEngine.getCurrent();
    if (!lyric || lyric.lines.length === 0) {
        display.innerHTML = '<p class="text-muted text-sm">暂无歌词</p>';
        return;
    }
    currentLyricLines = [];
    lyric.lines.forEach((line, i) => {
        const el = document.createElement('div');
        el.className = 'lyric-line';
        el.dataset.time = String(line.time);
        switch (lyricsMode) {
            case 'original':
                el.textContent = line.text;
                break;
            case 'bilingual':
                el.innerHTML = `${line.text}${line.transText ? `<span class="lyric-trans">${line.transText}</span>` : ''}`;
                if (line.transText && lyric.source === 'ai') {
                    el.innerHTML += '<span class="lyric-ai-badge">AI</span>';
                }
                break;
            case 'ruby':
                el.innerHTML = toRuby(line.text, line.romaText);
                break;
        }
        el.addEventListener('click', () => {
            audioEngine.seekTo(line.time);
        });
        currentLyricLines.push(el);
        display.appendChild(el);
    });
}
function toRuby(text, romaText) {
    if (!romaText)
        return text;
    // Basic implementation: wrap each character with <ruby>
    // In production, this would use a proper furigana annotation library
    return text.split('').map((char, i) => {
        return `<ruby>${char}<rt>${romaText[i] || ''}</rt></ruby>`;
    }).join('');
}
function highlightLyricLine(time) {
    const lyric = lyricsEngine.getCurrent();
    if (!lyric)
        return;
    const idx = lyricsEngine.findLineIndex(time);
    currentLyricLines.forEach((el, i) => {
        el.classList.remove('active', 'played');
        if (i === idx) {
            el.classList.add('active');
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        else if (i < idx) {
            el.classList.add('played');
        }
    });
}
// ---- Queue ----
function renderQueue() {
    const container = document.getElementById('player-queue');
    if (!container)
        return;
    container.innerHTML = '';
    state.queue.forEach((track, i) => {
        const row = document.createElement('div');
        row.className = 'queue-song';
        if (i === state.queueIndex)
            row.classList.add('playing');
        const cover = document.createElement('img');
        cover.className = 'q-cover';
        cover.src = track.album.picUrl ? `${track.album.picUrl}?param=70y70` : '';
        cover.alt = '';
        const info = document.createElement('div');
        info.className = 'q-info';
        info.innerHTML = `
      <div class="q-title">${track.name}</div>
      <div class="q-artist">${track.artists.map(a => a.name).join('/')}</div>
    `;
        const removeBtn = document.createElement('button');
        removeBtn.className = 'q-remove';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            state.queue.splice(i, 1);
            if (i < state.queueIndex)
                state.queueIndex--;
            if (state.queueIndex >= state.queue.length)
                state.queueIndex = state.queue.length - 1;
            bus.emit('queue:changed', state.queue);
        });
        row.appendChild(cover);
        row.appendChild(info);
        row.appendChild(removeBtn);
        row.addEventListener('click', () => {
            state.queueIndex = i;
            state.currentTrack = track;
            audioEngine.play(track);
        });
        container.appendChild(row);
    });
    if (state.queue.length === 0) {
        container.innerHTML = '<p class="text-muted text-sm" style="padding:16px;">队列为空</p>';
    }
}
async function loadSimilar(songId) {
    try {
        const json = await api.simiSong(songId);
        const songs = json.songs || [];
        const metaSimilar = document.getElementById('meta-similar');
        if (metaSimilar && songs.length > 0) {
            metaSimilar.innerHTML = songs.slice(0, 5).map((s) => `<div class="meta-row">
          <span>${s.name}</span>
          <span class="text-muted">${(s.artists || s.ar || []).map((a) => a.name).join('/')}</span>
        </div>`).join('');
        }
    }
    catch {
        // silently fail
    }
}
//# sourceMappingURL=player-page.js.map