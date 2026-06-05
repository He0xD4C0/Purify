import { bus } from './event-bus.js';
import { router } from './router.js';
import { api } from './api.js';
import { initNavbar } from '../components/navbar.js';
import { initPlayerBar } from '../components/player-bar.js';
import { initSearchBar } from '../components/search-bar.js';
import { renderHome } from '../pages/home.js';
import { renderLibrary } from '../pages/library.js';
import { renderAccount } from '../pages/account.js';
import { renderPlaylistDetail } from '../pages/playlist.js';
import { renderSettings } from '../pages/settings.js';
import { renderSearch } from '../pages/search.js';
import { renderPlayerPage } from '../pages/player-page.js';
import { renderLoginPanel } from '../components/login-panel.js';
import { audioEngine } from '../player/audio-engine.js';
export const state = {
    loggedIn: false,
    vipType: 'none',
    userProfile: null,
    currentTrack: null,
    queue: [],
    queueIndex: -1,
    playMode: 'list',
    playerPanel: 'cover',
    playerQueueVisible: false,
    currentPage: 'home',
    playing: false,
    currentTime: 0,
};
// ---- Cookie management ----
function restoreCookie() {
    // Cookie is stored as raw string, already at purify_cookie for API use
    // No action needed — api.ts reads localStorage.getItem('purify_cookie') directly
}
export function saveCookie(cookie) {
    // Store raw cookie string directly — do NOT JSON-serialize
    localStorage.setItem('purify_cookie', cookie);
}
export function clearCookie() {
    localStorage.removeItem('purify_cookie');
}
// ---- Page rendering ----
function getContent() {
    return document.getElementById('content');
}
/** Shared page dispatch — called by both router and nav events */
function renderContent(page) {
    const container = getContent();
    // Handle sub-routes like playlist/123, settings, search?q=
    if (page.startsWith('playlist/')) {
        const id = parseInt(page.split('/')[1]);
        if (id) {
            renderPlaylistDetail(container, id);
            return;
        }
    }
    if (page.startsWith('search')) {
        const q = new URLSearchParams(page.split('?')[1] || '').get('q') || '';
        renderSearch(container, q);
        return;
    }
    if (page.startsWith('settings')) {
        renderSettings(container);
        return;
    }
    switch (page) {
        case 'home':
            renderHome(container);
            break;
        case 'library':
            renderLibrary(container);
            break;
        case 'account':
            renderAccount(container);
            break;
        default:
            renderHome(container);
            break;
    }
}
function navigateTo(hash) {
    const page = hash || 'home';
    state.currentPage = page;
    bus.emit('nav:page', page);
}
function showPlayerOverlay() {
    const page = document.getElementById('player-page');
    if (!page)
        return;
    if (!page.classList.contains('hidden')) {
        page.classList.add('hidden');
        return;
    }
    renderPlayerPage();
}
// ---- Init ----
export async function init() {
    restoreCookie();
    // Init UI chrome
    initSearchBar();
    initNavbar();
    initPlayerBar();
    // Check login status asynchronously — does NOT block UI
    checkLoginStatus();
    // Set up router
    router.register('home', () => navigateTo('home'));
    router.register('library', () => navigateTo('library'));
    router.register('account', () => navigateTo('account'));
    router.register('settings', () => navigateTo('settings'));
    router.register('search', () => navigateTo(router.current())); // passes full hash incl. ?q=
    // Player overlay — available globally on all pages
    bus.on('player:open-overlay', () => showPlayerOverlay());
    // Global login trigger — any page can request auth via modal overlay
    bus.on('auth:require-login', () => {
        const overlay = document.getElementById('modal-overlay');
        if (!overlay)
            return;
        overlay.classList.remove('hidden');
        renderLoginPanel(overlay, () => {
            overlay.classList.add('hidden');
            overlay.innerHTML = '';
            renderContent(state.currentPage);
        });
    });
    // Single shared page dispatch
    bus.on('nav:page', (page) => {
        renderContent(page);
        // Hide search bar on account/settings pages
        const searchBar = document.getElementById('search-bar');
        if (searchBar) {
            searchBar.style.display = (page === 'account' || page === 'settings') ? 'none' : '';
        }
    });
    // Handle player page close
    bus.on('player:page-close', () => {
        const page = document.getElementById('player-page');
        if (page)
            page.classList.add('hidden');
    });
    // Handle player toggle from keyboard shortcuts
    bus.on('player:toggle', () => audioEngine.togglePlay());
    bus.on('player:seek', (offset) => audioEngine.seek(offset));
    bus.on('player:prev', () => audioEngine.playPrev());
    bus.on('player:next', () => audioEngine.playNext());
    // Seek-to (progress bar drag)
    bus.on('player:seek-to', (time) => audioEngine.seekTo(time));
    // Start router
    router.start();
    // Keyboard shortcuts
    setupKeyboardShortcuts();
}
export async function checkLoginStatus() {
    try {
        const res = await api.loginStatus();
        if (res.data?.account) {
            state.loggedIn = true;
            state.userProfile = {
                userId: res.data.account.id,
                nickname: res.data.profile?.nickname || '',
                avatarUrl: res.data.profile?.avatarUrl || '',
            };
            state.vipType = res.data.profile?.vipType === 11 ? 'svip' : res.data.profile?.vipType === 10 ? 'vip' : 'none';
            bus.emit('auth:login', state.userProfile);
            return;
        }
        // Account is null — cookie expired or invalid
        clearCookie();
    }
    catch {
        // API failed — cookie likely invalid
        clearCookie();
    }
    state.loggedIn = false;
}
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && e.target === document.body) {
            e.preventDefault();
            audioEngine.togglePlay();
        }
        if (e.code === 'ArrowLeft' && e.target === document.body) {
            bus.emit('player:seek', -5);
        }
        if (e.code === 'ArrowRight' && e.target === document.body) {
            bus.emit('player:seek', 5);
        }
    });
}
// ---- Queue helpers ----
export function addToQueue(tracks) {
    const list = Array.isArray(tracks) ? tracks : [tracks];
    state.queue.push(...list);
    if (state.queueIndex === -1)
        state.queueIndex = 0;
    bus.emit('queue:changed', state.queue);
}
export function playFromQueue(index) {
    if (index >= 0 && index < state.queue.length) {
        state.queueIndex = index;
        state.currentTrack = state.queue[index];
        audioEngine.play(state.currentTrack);
    }
}
export function playTrack(track, queue) {
    if (queue) {
        state.queue = queue;
        state.queueIndex = queue.findIndex((t) => t.id === track.id);
        if (state.queueIndex === -1)
            state.queueIndex = 0;
    }
    else {
        const existingIdx = state.queue.findIndex((t) => t.id === track.id);
        if (existingIdx >= 0) {
            state.queueIndex = existingIdx;
        }
        else {
            state.queue = [track];
            state.queueIndex = 0;
        }
    }
    state.currentTrack = track;
    state.playing = true;
    // audioEngine.play() is async and will emit player:track-change on success
    audioEngine.play(track);
}
export function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}
export function formatDuration(ms) {
    return formatTime(ms / 1000);
}
// ---- Bootstrap ----
init().catch(console.error);
//# sourceMappingURL=app.js.map