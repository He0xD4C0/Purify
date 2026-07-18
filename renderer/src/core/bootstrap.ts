import { bus } from './event-bus.js';
import { auth, checkLogin } from './auth.js';
import { renderLoginPanel } from '../components/login-panel.js';
import { audioEngine } from '../player/audio-engine.js';
import { renderPage } from './page-renderer.js';
import type { AppState } from './app.js';

function showPlayerOverlay(renderPlayerPage: () => void): void {
  const page = document.getElementById('player-page');
  if (!page) return;
  renderPlayerPage();
}

export function setupAuthEffects(state: AppState): void {
  bus.on('auth:login', (profile) => {
    state.loggedIn = true;
    state.userProfile = profile;
    state.vipType = auth.vipType;
    renderPage(state.currentPage);
  });

  bus.on('auth:logout', () => {
    state.loggedIn = false;
    state.userProfile = null;
    state.vipType = 'none';
  });
}

export function syncInitialAuthState(state: AppState): void {
  checkLogin().then(() => {
    state.loggedIn = auth.loggedIn;
    state.userProfile = auth.userProfile;
    state.vipType = auth.vipType;
    renderPage(state.currentPage);
  }).catch((error) => {
    console.warn('[Auth] checkLogin failed:', error);
  });
}

export function setupGlobalUiEffects(state: AppState, renderPlayerPage: () => void): void {
  bus.on('player:open-overlay', () => showPlayerOverlay(renderPlayerPage));

  bus.on('auth:require-login', () => {
    const overlay = document.getElementById('modal-overlay');
    if (!overlay) return;

    overlay.classList.remove('hidden');
    renderLoginPanel(overlay, () => {
      overlay.classList.add('hidden');
      overlay.innerHTML = '';
      renderPage(state.currentPage);
    });
  });

  bus.on('nav:page', (page: string) => {
    renderPage(page);

    const searchBar = document.getElementById('search-bar');
    if (searchBar) {
      searchBar.style.display = page === 'account' || page === 'settings' ? 'none' : '';
    }
  });

  bus.on('player:page-close', () => {
    const page = document.getElementById('player-page');
    if (page) page.classList.add('hidden');
  });
}

export function setupPlayerShortcuts(): void {
  bus.on('player:toggle', () => audioEngine.togglePlay());
  bus.on('player:seek', (offset: number) => audioEngine.seek(offset));
  bus.on('player:prev', () => audioEngine.playPrev());
  bus.on('player:next', () => audioEngine.playNext());
  bus.on('player:seek-to', (time: number) => audioEngine.seekTo(time));

  document.addEventListener('keydown', (event) => {
    if (event.code === 'Space' && event.target === document.body) {
      event.preventDefault();
      audioEngine.togglePlay();
    }

    if (event.code === 'ArrowLeft' && event.target === document.body) {
      bus.emit('player:seek', -5);
    }

    if (event.code === 'ArrowRight' && event.target === document.body) {
      bus.emit('player:seek', 5);
    }
  });
}