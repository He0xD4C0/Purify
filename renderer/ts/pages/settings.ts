// Settings pages using ColumnNav pattern

import { ColumnNav } from '../patterns/column-nav.js';
import { bus } from '../core/event-bus.js';
import { state } from '../core/app.js';
import { renderLoginPanel } from '../components/login-panel.js';

export function renderSettings(container: HTMLElement): void {
  container.innerHTML = '';

  const navRoot = document.createElement('div');
  container.appendChild(navRoot);

  new ColumnNav(navRoot, [
    {
      id: 'account',
      label: '账户',
      render: renderSettingsAccount,
    },
    {
      id: 'playback',
      label: '播放',
      render: renderSettingsPlayback,
    },
    {
      id: 'ai',
      label: 'AI 翻译',
      render: renderSettingsAI,
    },
    {
      id: 'appearance',
      label: '外观',
      inline: (el: HTMLElement) => {
        const isDark = (localStorage.getItem('purify_theme') || 'dark') === 'dark';
        const toggle = document.createElement('input');
        toggle.type = 'checkbox';
        toggle.checked = isDark;
        toggle.addEventListener('change', () => {
          const dark = toggle.checked;
          localStorage.setItem('purify_theme', dark ? 'dark' : 'light');
          applyTheme(dark);
        });
        el.appendChild(toggle);
      },
    },
    {
      id: 'cache',
      label: '缓存管理',
      inline: (el: HTMLElement) => {
        const btn = document.createElement('button');
        btn.textContent = '清除缓存';
        btn.style.cssText = 'padding:4px 12px;font-size:12px;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:var(--radius);color:var(--text-secondary);cursor:pointer;';
        btn.addEventListener('click', () => {
          // Clear AI translation cache
          Object.keys(localStorage).forEach((k) => {
            if (k.startsWith('lyric_tr_') || k.startsWith('purify_cache_')) {
              localStorage.removeItem(k);
            }
          });
          btn.textContent = '已清除 ✓';
          setTimeout(() => { btn.textContent = '清除缓存'; }, 2000);
        });
        el.appendChild(btn);
      },
    },
    {
      id: 'about',
      label: '关于 Purify',
      render: renderSettingsAbout,
    },
  ]);
}

function applyTheme(dark: boolean): void {
  if (dark) {
    document.documentElement.style.setProperty('--bg-primary', '#0a0a0f');
    document.documentElement.style.setProperty('--bg-secondary', '#12121a');
    document.documentElement.style.setProperty('--bg-tertiary', '#1a1a28');
    document.documentElement.style.setProperty('--text-primary', '#e8e8f0');
    document.documentElement.style.setProperty('--text-secondary', '#8888a0');
    document.documentElement.style.setProperty('--border', '#1e1e30');
  } else {
    document.documentElement.style.setProperty('--bg-primary', '#f5f5f7');
    document.documentElement.style.setProperty('--bg-secondary', '#ffffff');
    document.documentElement.style.setProperty('--bg-tertiary', '#e8e8ed');
    document.documentElement.style.setProperty('--text-primary', '#1a1a1a');
    document.documentElement.style.setProperty('--text-secondary', '#666666');
    document.documentElement.style.setProperty('--border', '#d1d1d6');
  }
}

function settingsPage(sections: { label: string; content: string; action?: () => void }[]): HTMLElement {
  const el = document.createElement('div');
  sections.forEach((s) => {
    const row = document.createElement('div');
    row.style.cssText = `
      display:flex; justify-content:space-between; align-items:center;
      padding:14px 0; border-bottom:1px solid var(--border); cursor:pointer;
    `;
    row.innerHTML = `<span>${s.label}</span>`;
    if (s.action) {
      row.innerHTML += '<span style="color:var(--text-muted);">›</span>';
      row.addEventListener('click', s.action);
    } else {
      row.innerHTML += `<span style="color:var(--text-muted);font-size:13px;">${s.content}</span>`;
    }
    el.appendChild(row);
  });
  return el;
}

function renderSettingsAccount(container: HTMLElement): void {
  if (state.loggedIn) {
    const profile = state.userProfile!;
    const vipLabel = state.vipType === 'svip' ? '黑胶SVIP' : state.vipType === 'vip' ? 'VIP' : '普通';
    container.appendChild(settingsPage([
      { label: '昵称', content: profile.nickname },
      { label: 'VIP 等级', content: vipLabel },
      { label: '退出登录', content: '', action: () => {
        if (confirm('确定退出登录？')) {
          localStorage.removeItem('purify_cookie');
          state.loggedIn = false;
          state.userProfile = null;
          state.vipType = 'none';
          bus.emit('auth:logout');
          renderSettingsAccount(container);
        }
      }},
    ]));
  } else {
    container.innerHTML = `
      <p class="text-muted" style="margin-bottom:12px;">未登录</p>
      <button class="btn-login-prompt">立即登录</button>
    `;
    container.querySelector('.btn-login-prompt')?.addEventListener('click', () => {
      const c = document.getElementById('content');
      if (c) renderLoginPanel(c);
    });
  }
}

function renderSettingsPlayback(container: HTMLElement): void {
  const quality = localStorage.getItem('purify_quality') || 'lossless';
  const qualities = ['standard', 'higher', 'exhigh', 'lossless', 'hires'];

  container.appendChild(settingsPage([
    {
      label: '默认音质',
      content: quality,
      action: () => {
        const idx = qualities.indexOf(quality);
        const next = qualities[(idx + 1) % qualities.length];
        localStorage.setItem('purify_quality', next);
        renderSettingsPlayback(container);
      },
    },
    { label: '自动播放下一首', content: '开启' },
  ]));
}

function renderSettingsAI(container: HTMLElement): void {
  const enabled = localStorage.getItem('purify_ai_enabled') === 'true';
  const apiKey = localStorage.getItem('purify_ai_key') || '';
  const endpoint = localStorage.getItem('purify_ai_endpoint') || 'https://api.openai.com/v1/chat/completions';
  const model = localStorage.getItem('purify_ai_model') || 'gpt-4o-mini';

  const el = document.createElement('div');
  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid var(--border);">
      <span>启用 AI 翻译</span>
      <input type="checkbox" id="ai-enabled" ${enabled ? 'checked' : ''}>
    </div>
    <div class="form-group" style="padding:14px 0;border-bottom:1px solid var(--border);">
      <label style="display:block;font-size:13px;color:var(--text-secondary);margin-bottom:6px;">API Key</label>
      <input type="password" id="ai-key" value="${apiKey}" placeholder="sk-..." style="width:100%;padding:8px 12px;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:var(--radius);color:var(--text-primary);font-size:14px;">
    </div>
    <div class="form-group" style="padding:14px 0;border-bottom:1px solid var(--border);">
      <label style="display:block;font-size:13px;color:var(--text-secondary);margin-bottom:6px;">API Endpoint</label>
      <input type="text" id="ai-endpoint" value="${endpoint}" style="width:100%;padding:8px 12px;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:var(--radius);color:var(--text-primary);font-size:14px;">
    </div>
    <div class="form-group" style="padding:14px 0;border-bottom:1px solid var(--border);">
      <label style="display:block;font-size:13px;color:var(--text-secondary);margin-bottom:6px;">Model</label>
      <input type="text" id="ai-model" value="${model}" style="width:100%;padding:8px 12px;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:var(--radius);color:var(--text-primary);font-size:14px;">
    </div>
  `;

  el.querySelector('#ai-enabled')?.addEventListener('change', (e) => {
    localStorage.setItem('purify_ai_enabled', String((e.target as HTMLInputElement).checked));
  });
  el.querySelector('#ai-key')?.addEventListener('change', (e) => {
    localStorage.setItem('purify_ai_key', (e.target as HTMLInputElement).value);
  });
  el.querySelector('#ai-endpoint')?.addEventListener('change', (e) => {
    localStorage.setItem('purify_ai_endpoint', (e.target as HTMLInputElement).value);
  });
  el.querySelector('#ai-model')?.addEventListener('change', (e) => {
    localStorage.setItem('purify_ai_model', (e.target as HTMLInputElement).value);
  });

  container.appendChild(el);
}

function renderSettingsAbout(container: HTMLElement): void {
  const el = document.createElement('div');
  el.style.padding = '16px 0';
  el.innerHTML = `
    <div style="text-align:center;margin-bottom:24px;">
      <h1 style="font-size:28px;">Purify</h1>
      <p style="color:var(--text-muted);">v0.1.0</p>
    </div>
    <p style="color:var(--text-secondary);font-size:14px;line-height:1.8;text-align:center;">
      网易云音乐第三方 Web 播放器<br>
      Chrome-first · 匿名优先<br>
      Powered by NeteaseCloudMusicApiEnhanced
    </p>
    <p style="color:var(--text-muted);font-size:12px;text-align:center;margin-top:16px;">
      MIT License · 仅供学习交流
    </p>
  `;
  container.appendChild(el);
}
