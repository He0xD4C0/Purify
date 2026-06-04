import { bus } from './event-bus.js';
import { router } from './router.js';
import { storage } from './storage.js';
import { api } from './api.js';
import { initNavbar } from '../components/navbar.js';
import { initPlayerBar } from '../components/player-bar.js';
import { renderHome } from '../pages/home.js';
import { renderLibrary } from '../pages/library.js';
import { renderAccount } from '../pages/account.js';
import { renderPlaylistDetail } from '../pages/playlist.js';
import { renderSettings } from '../pages/settings.js';
import { renderPlayerPage } from '../pages/player-page.js';
import { audioEngine } from '../player/audio-engine.js';

// ---- App State ----
export interface Track {
  id: number;
  name: string;
  artists: { id: number; name: string }[];
  album: { id: number; name: string; picUrl: string };
  duration: number;
  fee?: number;
  privilege?: Record<string, unknown>;
}

export interface AppState {
  loggedIn: boolean;
  vipType: 'none' | 'vip' | 'svip';
  userProfile: { userId: number; nickname: string; avatarUrl: string } | null;
  currentTrack: Track | null;
  queue: Track[];
  queueIndex: number;
  playMode: 'list' | 'random' | 'single';
  playerPanel: 'cover' | 'metadata' | 'lyrics' | 'queue';
  playerQueueVisible: boolean;
  currentPage: string;
  playing: boolean;
  currentTime: number;
}

export const state: AppState = {
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
function restoreCookie(): void {
  const cookie = storage.get<string>('cookie');
  if (cookie) {
    localStorage.setItem('purify_cookie', cookie);
  }
}

export function saveCookie(cookie: string): void {
  storage.set('cookie', cookie);
  localStorage.setItem('purify_cookie', cookie);
}

export function clearCookie(): void {
  storage.remove('cookie');
  localStorage.removeItem('purify_cookie');
}

// ---- Page rendering ----
function getContent(): HTMLElement {
  return document.getElementById('content')!;
}

/** Shared page dispatch — called by both router and nav events */
function renderContent(page: string): void {
  const container = getContent();

  // Handle sub-routes like playlist/123, settings/account
  if (page.startsWith('playlist/')) {
    const id = parseInt(page.split('/')[1]);
    if (id) {
      renderPlaylistDetail(container, id);
      return;
    }
  }
  if (page.startsWith('settings')) {
    renderSettings(container);
    return;
  }

  switch (page) {
    case 'home':    renderHome(container); break;
    case 'library': renderLibrary(container); break;
    case 'account': renderAccount(container); break;
    default:        renderHome(container); break;
  }
}

function navigateTo(hash: string): void {
  const page = hash || 'home';
  state.currentPage = page;
  bus.emit('nav:page', page);
}

function showPlayerOverlay(): void {
  const page = document.getElementById('player-page');
  if (!page) return;
  if (!page.classList.contains('hidden')) {
    page.classList.add('hidden');
    return;
  }
  renderPlayerPage();
}

// ---- Init ----
export async function init(): Promise<void> {
  restoreCookie();

  // Init UI chrome
  initNavbar();
  initPlayerBar();

  // Check login status asynchronously — does NOT block UI
  checkLoginStatus();

  // Set up router
  router.register('home', () => navigateTo('home'));
  router.register('library', () => navigateTo('library'));
  router.register('account', () => navigateTo('account'));
  router.register('settings', () => navigateTo('settings'));

  // Player overlay — available globally on all pages
  bus.on('player:open-overlay', () => showPlayerOverlay());

  // Single shared page dispatch
  bus.on('nav:page', (page: string) => renderContent(page));

  // Handle player page close
  bus.on('player:page-close', () => {
    const page = document.getElementById('player-page');
    if (page) page.classList.add('hidden');
  });

  // Handle player toggle from keyboard shortcuts
  bus.on('player:toggle', () => audioEngine.togglePlay());
  bus.on('player:seek', (offset: number) => audioEngine.seek(offset));
  bus.on('player:prev', () => audioEngine.playPrev());
  bus.on('player:next', () => audioEngine.playNext());

  // Seek-to (progress bar drag)
  bus.on('player:seek-to', (time: number) => audioEngine.seekTo(time));

  // Start router
  router.start();

  // Keyboard shortcuts
  setupKeyboardShortcuts();
}

async function checkLoginStatus(): Promise<void> {
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
    }
  } catch {
    state.loggedIn = false;
  }
}

function setupKeyboardShortcuts(): void {
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
export function addToQueue(tracks: Track | Track[]): void {
  const list = Array.isArray(tracks) ? tracks : [tracks];
  state.queue.push(...list);
  if (state.queueIndex === -1) state.queueIndex = 0;
  bus.emit('queue:changed', state.queue);
}

export function playFromQueue(index: number): void {
  if (index >= 0 && index < state.queue.length) {
    state.queueIndex = index;
    state.currentTrack = state.queue[index];
    audioEngine.play(state.currentTrack);
    bus.emit('player:track-change', state.currentTrack);
  }
}

export function playTrack(track: Track, queue?: Track[]): void {
  if (queue) {
    state.queue = queue;
    state.queueIndex = queue.findIndex((t) => t.id === track.id);
    if (state.queueIndex === -1) state.queueIndex = 0;
  } else {
    const existingIdx = state.queue.findIndex((t) => t.id === track.id);
    if (existingIdx >= 0) {
      state.queueIndex = existingIdx;
    } else {
      state.queue = [track];
      state.queueIndex = 0;
    }
  }
  state.currentTrack = track;
  state.playing = true;
  audioEngine.play(track);
  bus.emit('player:track-change', track);
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatDuration(ms: number): string {
  return formatTime(ms / 1000);
}

// ---- Bootstrap ----
init().catch(console.error);
