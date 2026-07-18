import { bus } from './event-bus.js';
import { router } from './router.js';
import {
  setupAuthEffects,
  setupGlobalUiEffects,
  setupPlayerShortcuts,
  syncInitialAuthState,
} from './bootstrap.js';
import { renderPage } from './page-renderer.js';
import { registerRoutes } from './route-registry.js';
import { initNavbar } from '../components/navbar.js';
import { initPlayerBar } from '../components/player-bar.js';
import { initSearchBar } from '../components/search-bar.js';
import { renderPlayerPage } from '../pages/player-page.js';
import { audioEngine } from '../player/audio-engine.js';
import { clearCookie, saveCookie } from './auth.js';

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
  userProfile: { userId: number; nickname: string; avatarUrl: string; signature: string } | null;
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

// ---- Cookie re-exports (from auth module) ----
export { saveCookie, clearCookie };

function navigateTo(hash: string): void {
  const page = hash || 'home';
  state.currentPage = page;
  bus.emit('nav:page', page);
}

// ---- Init ----
export async function init(): Promise<void> {
  // Init UI chrome
  initSearchBar();
  initNavbar();
  initPlayerBar();

  setupAuthEffects(state);
  syncInitialAuthState(state);

  registerRoutes(navigateTo);
  setupGlobalUiEffects(state, renderPlayerPage);
  setupPlayerShortcuts();

  // Start router
  router.start();
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
  // audioEngine.play() is async and will emit player:track-change on success
  audioEngine.play(track);
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
