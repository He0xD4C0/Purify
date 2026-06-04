// Account page — user info, VIP status, settings entry

import { router } from '../core/router.js';
import { bus } from '../core/event-bus.js';
import { state, clearCookie } from '../core/app.js';
import { renderLoginPanel } from '../components/login-panel.js';

export function renderAccount(container: HTMLElement): void {
  container.innerHTML = '';

  if (!state.loggedIn) {
    container.innerHTML = `
      <div class="login-prompt">
        <h2>👤 账户</h2>
        <p>登录以管理您的账户</p>
        <button class="btn-login-prompt">立即登录</button>
      </div>
    `;
    container.querySelector('.btn-login-prompt')?.addEventListener('click', () => {
      const c = document.getElementById('content');
      if (c) renderLoginPanel(c);
    });
    return;
  }

  const profile = state.userProfile!;
  const vipLabel = state.vipType === 'svip' ? '黑胶SVIP' : state.vipType === 'vip' ? 'VIP' : '普通用户';
  const vipClass = state.vipType === 'svip' ? 'svip' : state.vipType === 'vip' ? 'vip' : '';

  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:16px;padding:16px;background:var(--bg-secondary);border-radius:var(--radius-lg);margin-bottom:20px;">
      <img src="${profile.avatarUrl}?param=100y100" style="width:64px;height:64px;border-radius:50%;object-fit:cover;" alt="">
      <div>
        <div style="font-size:20px;font-weight:600;">${profile.nickname}</div>
        <span class="music-badge ${vipClass}" style="margin-top:4px;">${vipLabel}</span>
      </div>
    </div>

    <div class="account-menu">
      <button class="account-menu-item" data-action="logout">
        <span>🚪 退出登录</span><span>›</span>
      </button>
    </div>
  `;

  // Style for menu items
  const style = document.createElement('style');
  style.textContent = `
    .account-menu-item {
      display: flex; justify-content: space-between; align-items: center;
      width: 100%; padding: 14px 16px; margin-bottom: 4px;
      background: var(--bg-secondary); border: none; border-radius: var(--radius);
      color: var(--text-primary); font-size: 15px; cursor: pointer;
      transition: background var(--transition-fast);
    }
    .account-menu-item:hover { background: var(--bg-hover); }
  `;
  container.appendChild(style);

  // Event handlers
  container.querySelector('[data-action="logout"]')?.addEventListener('click', () => {
    clearCookie();
    state.loggedIn = false;
    state.userProfile = null;
    state.vipType = 'none';
    bus.emit('auth:logout');
    renderAccount(container);
  });
}
