// Settings pages using ColumnNav pattern
import { ColumnNav } from '../patterns/column-nav.js';
export function renderSettings(container) {
    container.innerHTML = '';
    const navRoot = document.createElement('div');
    container.appendChild(navRoot);
    new ColumnNav(navRoot, [
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
            inline: (el) => {
                const isDark = (localStorage.getItem('purify_theme') || 'dark') === 'dark';
                const toggle = document.createElement('button');
                toggle.className = 'acct-toggle' + (isDark ? ' on' : '');
                toggle.addEventListener('click', () => {
                    const dark = !toggle.classList.contains('on');
                    toggle.classList.toggle('on', dark);
                    localStorage.setItem('purify_theme', dark ? 'dark' : 'light');
                    applyTheme(dark);
                });
                el.appendChild(toggle);
            },
        },
        {
            id: 'cache',
            label: '缓存管理',
            inline: (el) => {
                const btn = document.createElement('button');
                btn.textContent = '清除缓存';
                btn.className = 'acct-btn-primary';
                btn.style.cssText = 'padding:4px 12px;font-size:12px;margin-top:0;';
                btn.addEventListener('click', () => {
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
function applyTheme(dark) {
    if (dark) {
        document.documentElement.style.setProperty('--bg-primary', '#0a0a0f');
        document.documentElement.style.setProperty('--bg-secondary', '#12121a');
        document.documentElement.style.setProperty('--bg-tertiary', '#1a1a28');
        document.documentElement.style.setProperty('--text-primary', '#e8e8f0');
        document.documentElement.style.setProperty('--text-secondary', '#8888a0');
        document.documentElement.style.setProperty('--border', '#1e1e30');
    }
    else {
        document.documentElement.style.setProperty('--bg-primary', '#f5f5f7');
        document.documentElement.style.setProperty('--bg-secondary', '#ffffff');
        document.documentElement.style.setProperty('--bg-tertiary', '#e8e8ed');
        document.documentElement.style.setProperty('--text-primary', '#1a1a1a');
        document.documentElement.style.setProperty('--text-secondary', '#666666');
        document.documentElement.style.setProperty('--border', '#d1d1d6');
    }
}
function settingsPage(sections) {
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
        }
        else {
            row.innerHTML += `<span style="color:var(--text-muted);font-size:13px;">${s.content}</span>`;
        }
        el.appendChild(row);
    });
    return el;
}
function renderSettingsPlayback(container) {
    const quality = localStorage.getItem('purify_quality') || 'lossless';
    const qualities = ['standard', 'higher', 'exhigh', 'lossless', 'hires'];
    const qualityLabels = {
        standard: '标准', higher: '较高', exhigh: '极高', lossless: '无损', hires: 'Hi-Res',
    };
    const crossfade = localStorage.getItem('purify_crossfade') === 'true';
    const el = document.createElement('div');
    // Quality row
    const qRow = document.createElement('div');
    qRow.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid var(--border);cursor:pointer;';
    qRow.innerHTML = `<span>默认音质</span><span style="color:var(--text-muted);font-size:13px;">${qualityLabels[quality] || quality} ›</span>`;
    qRow.addEventListener('click', () => {
        const idx = qualities.indexOf(quality);
        const next = qualities[(idx + 1) % qualities.length];
        localStorage.setItem('purify_quality', next);
        renderSettingsPlayback(container);
    });
    el.appendChild(qRow);
    // Auto-play toggle
    const apRow = document.createElement('div');
    apRow.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid var(--border);';
    apRow.innerHTML = '<span>自动播放下一首</span>';
    const toggle = document.createElement('button');
    toggle.className = 'acct-toggle' + (crossfade ? ' on' : '');
    toggle.addEventListener('click', () => {
        const v = !toggle.classList.contains('on');
        toggle.classList.toggle('on', v);
        localStorage.setItem('purify_crossfade', String(v));
    });
    apRow.appendChild(toggle);
    el.appendChild(apRow);
    container.appendChild(el);
}
function renderSettingsAI(container) {
    const enabled = localStorage.getItem('purify_ai_enabled') === 'true';
    const apiKey = localStorage.getItem('purify_ai_key') || '';
    const endpoint = localStorage.getItem('purify_ai_endpoint') || 'https://api.openai.com/v1/chat/completions';
    const model = localStorage.getItem('purify_ai_model') || 'gpt-4o-mini';
    const el = document.createElement('div');
    // Enable toggle
    const toggleRow = document.createElement('div');
    toggleRow.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid var(--border);';
    toggleRow.innerHTML = '<span>启用 AI 翻译</span>';
    const toggle = document.createElement('button');
    toggle.className = 'acct-toggle' + (enabled ? ' on' : '');
    toggle.addEventListener('click', () => {
        const v = !toggle.classList.contains('on');
        toggle.classList.toggle('on', v);
        localStorage.setItem('purify_ai_enabled', String(v));
    });
    toggleRow.appendChild(toggle);
    el.appendChild(toggleRow);
    // Fields
    const fields = [
        { id: 'ai-key', label: 'API Key', value: apiKey, type: 'password', placeholder: 'sk-...' },
        { id: 'ai-endpoint', label: 'API Endpoint', value: endpoint, type: 'text' },
        { id: 'ai-model', label: 'Model', value: model, type: 'text' },
    ];
    fields.forEach((f) => {
        const row = document.createElement('div');
        row.style.cssText = 'padding:14px 0;border-bottom:1px solid var(--border);';
        row.innerHTML = `
      <label style="display:block;font-size:13px;color:var(--text-secondary);margin-bottom:6px;">${f.label}</label>
      <input type="${f.type}" id="${f.id}" value="${f.value}" ${f.placeholder ? `placeholder="${f.placeholder}"` : ''}
        style="width:100%;padding:8px 12px;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:var(--radius);color:var(--text-primary);font-size:14px;">
    `;
        row.querySelector(`#${f.id}`)?.addEventListener('change', (e) => {
            localStorage.setItem(`purify_${f.id.replace('ai-', 'ai_')}`, e.target.value);
        });
        el.appendChild(row);
    });
    container.appendChild(el);
}
function renderSettingsAbout(container) {
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
//# sourceMappingURL=settings.js.map