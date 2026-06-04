// Account page — profile, stats, settings with sub-page navigation
import { router } from '../core/router.js';
import { bus } from '../core/event-bus.js';
import { state, clearCookie } from '../core/app.js';
import { api } from '../core/api.js';
let activeSubPage = 'main';
// ---- Styles ----
let stylesInjected = false;
function injectStyles() {
    if (stylesInjected)
        return;
    stylesInjected = true;
    const s = document.createElement('style');
    s.textContent = `
    .acct-hero {
      text-align: center; padding: 32px 20px 24px;
    }
    .acct-avatar-lg {
      width: 88px; height: 88px; border-radius: 50%; object-fit: cover;
      background: var(--bg-tertiary);
    }
    .acct-name-lg {
      font-size: 22px; font-weight: 700; margin-top: 12px;
    }
    .acct-sub {
      font-size: 13px; color: var(--text-muted); margin-top: 4px;
    }
    .acct-stats {
      display: flex; justify-content: center; gap: 32px;
      margin: 20px 16px;
      padding: 12px 0;
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
    }
    .acct-stat { text-align: center; }
    .acct-stat-num { font-size: 20px; font-weight: 700; }
    .acct-stat-label {
      font-size: 11px; color: var(--text-muted); margin-top: 2px;
    }
    /* Grouped list — iOS-style */
    .acct-section { margin: 0 16px 16px; }
    .acct-section-title {
      font-size: 11px; color: var(--text-muted); text-transform: uppercase;
      letter-spacing: 1px; padding: 0 4px 8px;
    }
    .acct-group {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }
    .acct-item {
      display: flex; align-items: center;
      padding: 14px 16px;
      cursor: pointer; transition: background var(--transition-fast);
      border: none; width: 100%; text-align: left;
      color: var(--text-primary); font-size: 14px;
      background: none;
    }
    .acct-item + .acct-item {
      border-top: 1px solid var(--border);
    }
    .acct-item:hover { background: var(--bg-hover); }
    .acct-item .acct-item-icon { margin-right: 12px; font-size: 18px; }
    .acct-item .acct-item-label { flex: 1; }
    .acct-item .acct-item-value { color: var(--text-muted); font-size: 13px; margin-right: 8px; }
    .acct-item .acct-item-arrow { color: var(--text-muted); font-size: 16px; }
    .acct-item.danger { color: #ff4444; }
    .acct-item.danger:hover { background: rgba(255,68,68,0.08); }
    .acct-item.danger + .acct-item { border-top-color: rgba(255,68,68,0.15); }
    .acct-toggle { width: 44px; height: 24px; border-radius: 12px; background: var(--bg-hover);
      border: none; cursor: pointer; position: relative; transition: background var(--transition-fast);
      flex-shrink: 0; }
    .acct-toggle.on { background: var(--accent); }
    .acct-toggle::after { content: ''; position: absolute; top: 2px; left: 2px;
      width: 20px; height: 20px; border-radius: 50%; background: white;
      transition: transform var(--transition-fast); }
    .acct-toggle.on::after { transform: translateX(20px); }
    .acct-btn-primary {
      padding: 10px 32px; background: var(--accent); color: white;
      border: none; border-radius: var(--radius-pill); font-size: 15px;
      cursor: pointer; margin-top: 16px;
    }
    .acct-back-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 16px; margin-bottom: 8px;
      background: none; border: none; color: var(--text-secondary);
      font-size: 14px; cursor: pointer;
    }
    .acct-back-btn:hover { color: var(--text-primary); }
    /* Info card */
    .acct-info-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }
    .acct-info-card .acct-item {
      cursor: default;
    }
    .acct-info-card .acct-item:hover {
      background: none;
    }
    /* Form inputs in sub-pages */
    .acct-field {
      width: 100%; padding: 8px 12px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      color: var(--text-primary); font-size: 14px;
      outline: none;
    }
    .acct-field:focus { border-color: var(--accent); }
  `;
    document.head.appendChild(s);
}
export function renderAccount(container) {
    injectStyles();
    activeSubPage = 'main';
    container.innerHTML = '';
    renderMain(container);
}
// ============ Main account page ============
function renderMain(container) {
    container.innerHTML = '';
    const loggedIn = state.loggedIn;
    const profile = state.userProfile;
    // ---- Profile hero (centered) ----
    const hero = document.createElement('div');
    hero.className = 'acct-hero';
    if (loggedIn && profile) {
        hero.innerHTML = `
      <img class="acct-avatar-lg" src="${profile.avatarUrl}?param=200y200" alt="">
      <div class="acct-name-lg">${profile.nickname}</div>
      <div class="acct-sub" id="acct-vip-tag"></div>
    `;
    }
    else {
        // Placeholder — click to login
        hero.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" width="88" height="88" style="color:var(--text-muted);cursor:pointer;" id="acct-avatar-placeholder">
        <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-7 8-7s8 3 8 7"/>
      </svg>
      <div class="acct-name-lg" style="color:var(--text-muted);cursor:pointer;" id="acct-name-placeholder">登录使用更多功能</div>
      <div class="acct-sub" style="color:var(--text-muted);">点击头像或昵称登录</div>
    `;
    }
    container.appendChild(hero);
    if (loggedIn) {
        const vipTag = document.getElementById('acct-vip-tag');
        if (vipTag) {
            const vt = state.vipType;
            if (vt === 'svip')
                vipTag.innerHTML = '<span class="music-badge svip" style="font-size:12px;padding:2px 10px;">黑胶 SVIP</span>';
            else if (vt === 'vip')
                vipTag.innerHTML = '<span class="music-badge vip" style="font-size:12px;padding:2px 10px;">VIP</span>';
            else
                vipTag.textContent = '普通用户';
        }
    }
    else {
        // Wire placeholder clicks → login
        hero.querySelector('#acct-avatar-placeholder')?.addEventListener('click', () => bus.emit('auth:require-login'));
        hero.querySelector('#acct-name-placeholder')?.addEventListener('click', () => bus.emit('auth:require-login'));
    }
    // ---- Stats ----
    const stats = document.createElement('div');
    stats.className = 'acct-stats';
    stats.innerHTML = `
    <div class="acct-stat"><div class="acct-stat-num" id="as-follows">--</div><div class="acct-stat-label">关注</div></div>
    <div class="acct-stat"><div class="acct-stat-num" id="as-fans">--</div><div class="acct-stat-label">粉丝</div></div>
    <div class="acct-stat"><div class="acct-stat-num" id="as-playlists">--</div><div class="acct-stat-label">歌单</div></div>
    <div class="acct-stat"><div class="acct-stat-num" id="as-likes">--</div><div class="acct-stat-label">喜欢</div></div>
  `;
    container.appendChild(stats);
    if (loggedIn)
        fetchUserStats();
    // ---- Account Info section ----
    const infoSection = document.createElement('div');
    infoSection.className = 'acct-section';
    infoSection.innerHTML = '<div class="acct-section-title">账户信息</div>';
    const infoWrap = document.createElement('div');
    infoWrap.id = 'acct-info-wrap';
    if (loggedIn) {
        infoWrap.innerHTML = '<div style="padding:12px 16px;" class="text-muted text-sm">加载中...</div>';
        infoSection.appendChild(infoWrap);
        container.appendChild(infoSection);
        fetchAccountInfo(infoWrap);
    }
    else {
        // Placeholder info rows
        const placeholders = ['用户 ID', '昵称', '签名', 'VIP', '等级', '性别', '生日', '地区', '手机绑定', '邮箱绑定'];
        const card = document.createElement('div');
        card.className = 'acct-info-card';
        placeholders.forEach((label) => {
            const row = document.createElement('div');
            row.className = 'acct-item';
            row.style.cursor = 'pointer';
            row.innerHTML = `<span class="acct-item-label">${label}</span><span class="acct-item-value" style="color:var(--text-muted);font-size:12px;">登录后查看</span>`;
            row.addEventListener('click', () => bus.emit('auth:require-login'));
            card.appendChild(row);
        });
        infoWrap.appendChild(card);
        infoSection.appendChild(infoWrap);
        container.appendChild(infoSection);
    }
    // ---- Music Library section ----
    const libSection = acctSection('音乐库', [
        acctItem('我的歌单', '', () => router.navigate('library')),
        acctItem('最近播放', '', () => router.navigate('library')),
    ]);
    container.appendChild(libSection);
    // ---- Settings section ----
    const settSection = acctSection('设置', [
        acctItem('播放设置', '', () => showSubPage(container, 'playback')),
        acctItem('AI 翻译', '', () => showSubPage(container, 'ai-translate')),
        acctItem('外观', '', () => showSubPage(container, 'appearance')),
        acctItemInline('清除缓存', '', () => {
            Object.keys(localStorage).forEach(k => { if (k.startsWith('lyric_tr_'))
                localStorage.removeItem(k); });
            alert('缓存已清除');
        }),
    ]);
    container.appendChild(settSection);
    // ---- About section ----
    const aboutSection = acctSection('关于', [
        acctItem('关于 Purify', '', () => showSubPage(container, 'about')),
    ]);
    container.appendChild(aboutSection);
    // ---- Danger zone ----
    const logoutItem = acctItem('退出登录', '', () => {
        clearCookie();
        state.loggedIn = false;
        state.userProfile = null;
        state.vipType = 'none';
        bus.emit('auth:logout');
        renderAccount(container);
    });
    logoutItem.classList.add('danger');
    const dangerSection = acctSection('账户操作', [logoutItem]);
    container.appendChild(dangerSection);
}
// ============ Sub-pages ============
function showSubPage(container, page) {
    activeSubPage = page;
    container.innerHTML = '';
    const backBtn = document.createElement('button');
    backBtn.className = 'acct-back-btn';
    backBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polyline points="15 18 9 12 15 6"/></svg> 返回';
    backBtn.addEventListener('click', () => { activeSubPage = 'main'; renderAccount(container); });
    container.appendChild(backBtn);
    switch (page) {
        case 'playback':
            renderPlaybackSub(container);
            break;
        case 'ai-translate':
            renderAISub(container);
            break;
        case 'appearance':
            renderAppearanceSub(container);
            break;
        case 'about':
            renderAboutSub(container);
            break;
    }
}
function renderPlaybackSub(container) {
    const quality = localStorage.getItem('purify_quality') || 'lossless';
    const qualities = ['standard', 'higher', 'exhigh', 'lossless', 'hires'];
    const crossfade = localStorage.getItem('purify_crossfade') === 'true';
    let qIdx = qualities.indexOf(quality);
    container.appendChild(acctSection('音质与播放', [
        acctItem('默认音质', quality, () => {
            qIdx = (qIdx + 1) % qualities.length;
            localStorage.setItem('purify_quality', qualities[qIdx]);
            renderPlaybackSub(container);
        }),
        acctToggle('自动播放下一首', crossfade, (v) => {
            localStorage.setItem('purify_crossfade', String(v));
        }),
    ]));
}
function renderAISub(container) {
    const enabled = localStorage.getItem('purify_ai_enabled') === 'true';
    const apiKey = localStorage.getItem('purify_ai_key') || '';
    const endpoint = localStorage.getItem('purify_ai_endpoint') || 'https://api.openai.com/v1/chat/completions';
    const model = localStorage.getItem('purify_ai_model') || 'gpt-4o-mini';
    container.appendChild(acctSection('AI 歌词翻译', [
        acctToggle('启用 AI 翻译', enabled, (v) => {
            localStorage.setItem('purify_ai_enabled', String(v));
        }),
    ]));
    // API Key, Endpoint, Model fields
    const fields = document.createElement('div');
    fields.style.cssText = 'margin:0 16px 16px;';
    fields.innerHTML = `
    <div class="acct-group" style="padding:12px;display:flex;flex-direction:column;gap:10px;">
      <div>
        <label style="display:block;font-size:12px;color:var(--text-muted);margin-bottom:4px;">API Key</label>
        <input id="ai-key" type="password" value="${apiKey}" placeholder="sk-..." class="acct-field">
      </div>
      <div>
        <label style="display:block;font-size:12px;color:var(--text-muted);margin-bottom:4px;">API Endpoint</label>
        <input id="ai-endpoint" type="text" value="${endpoint}" class="acct-field">
      </div>
      <div>
        <label style="display:block;font-size:12px;color:var(--text-muted);margin-bottom:4px;">Model</label>
        <input id="ai-model" type="text" value="${model}" class="acct-field">
      </div>
    </div>
  `;
    container.appendChild(fields);
    fields.querySelector('#ai-key')?.addEventListener('change', (e) => localStorage.setItem('purify_ai_key', e.target.value));
    fields.querySelector('#ai-endpoint')?.addEventListener('change', (e) => localStorage.setItem('purify_ai_endpoint', e.target.value));
    fields.querySelector('#ai-model')?.addEventListener('change', (e) => localStorage.setItem('purify_ai_model', e.target.value));
}
function renderAppearanceSub(container) {
    const isDark = (localStorage.getItem('purify_theme') || 'dark') === 'dark';
    container.appendChild(acctSection('主题', [
        acctToggle('深色主题', isDark, (v) => {
            localStorage.setItem('purify_theme', v ? 'dark' : 'light');
            applyTheme(v);
        }),
    ]));
}
function renderAboutSub(container) {
    container.appendChild(sectionTitle('关于'));
    const about = document.createElement('div');
    about.style.cssText = 'text-align:center;padding:20px 16px;';
    about.innerHTML = `
    <h1 style="font-size:28px;margin-bottom:4px;">Purify</h1>
    <p style="color:var(--text-muted);">v0.1.0</p>
    <p style="color:var(--text-secondary);font-size:14px;line-height:1.8;margin-top:16px;">
      网易云音乐第三方 Web 播放器<br>
      Chrome-first · 匿名优先<br>
      Powered by NeteaseCloudMusicApiEnhanced
    </p>
    <p style="color:var(--text-muted);font-size:12px;margin-top:12px;">
      MIT License · 仅供学习交流
    </p>
  `;
    container.appendChild(about);
}
// ============ Reusable items ============
function sectionTitle(text) {
    const el = document.createElement('div');
    el.className = 'acct-section-title';
    el.textContent = text;
    return el;
}
/** Create a section with grouped items */
function acctSection(title, items) {
    const sec = document.createElement('div');
    sec.className = 'acct-section';
    sec.innerHTML = `<div class="acct-section-title">${title}</div>`;
    const group = document.createElement('div');
    group.className = 'acct-group';
    items.forEach((item) => group.appendChild(item));
    sec.appendChild(group);
    return sec;
}
/** Standard item with arrow → sub-page */
function acctItem(label, value, onClick) {
    const btn = document.createElement('button');
    btn.className = 'acct-item';
    btn.innerHTML = `
    <span class="acct-item-label">${label}</span>
    ${value ? `<span class="acct-item-value">${value}</span>` : ''}
    <span class="acct-item-arrow">›</span>
  `;
    btn.addEventListener('click', onClick);
    return btn;
}
/** Inline action item — no arrow */
function acctItemInline(label, value, onClick) {
    const btn = document.createElement('button');
    btn.className = 'acct-item';
    btn.innerHTML = `
    <span class="acct-item-label">${label}</span>
    ${value ? `<span class="acct-item-value">${value}</span>` : ''}
  `;
    btn.addEventListener('click', onClick);
    return btn;
}
/** Item with toggle switch */
function acctToggle(label, checked, onChange) {
    const row = document.createElement('div');
    row.className = 'acct-item';
    row.style.cursor = 'default';
    row.innerHTML = `<span class="acct-item-label">${label}</span>`;
    const toggle = document.createElement('button');
    toggle.className = 'acct-toggle' + (checked ? ' on' : '');
    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const now = !toggle.classList.contains('on');
        toggle.classList.toggle('on', now);
        onChange(now);
    });
    row.appendChild(toggle);
    return row;
}
// ============ Account Info ============
async function fetchAccountInfo(wrap) {
    try {
        const [acctRes, levelRes] = await Promise.all([
            api.userAccount(),
            api.userLevel(),
        ]);
        const acct = (acctRes.body || acctRes) || {};
        const profile = acct.profile || {};
        const level = (levelRes.body || levelRes).data || levelRes.data || {};
        // VIP info
        const vipType = profile.vipType || 0;
        const vipLabel = vipType === 11 ? '黑胶 SVIP' : vipType === 10 ? 'VIP' : '普通用户';
        const vipClass = vipType === 11 ? 'svip' : vipType === 10 ? 'vip' : '';
        const vipExpire = profile.vipRights?.redVipAnnualCount !== undefined
            ? '年度会员' : '';
        const rows = [
            { label: '用户 ID', value: String(profile.userId || acct.account?.id || state.userProfile?.userId || '--') },
            { label: '昵称', value: profile.nickname || '--' },
            { label: '签名', value: profile.signature || '（未设置）' },
            { label: 'VIP', value: vipLabel, cls: vipClass },
            { label: '等级', value: level.level != null ? `Lv.${level.level}` : '--' },
            { label: '性别', value: profile.gender === 1 ? '男' : profile.gender === 2 ? '女' : '未设置' },
            { label: '生日', value: profile.birthday && profile.birthday > 0
                    ? new Date(profile.birthday).toISOString().split('T')[0] : '未设置' },
            { label: '地区', value: [profile.province, profile.city].filter(Boolean).join(' ') || '未设置' },
        ];
        // Account binding status
        if (acct.account) {
            const a = acct.account;
            if (a.userName)
                rows.push({ label: '用户名', value: a.userName });
            rows.push({ label: '手机绑定', value: a.bindings?.some((b) => b.type === 1) ? '已绑定' : '未绑定' });
            rows.push({ label: '邮箱绑定', value: a.bindings?.some((b) => b.type === 2) ? '已绑定' : '未绑定' });
            rows.push({ label: '账户类型', value: a.type === 1 ? '手机' : a.type === 2 ? '邮箱' : a.type === 5 ? 'QQ' : a.type === 10 ? '微信' : '其他' });
            if (a.createTime) {
                rows.push({ label: '注册时间', value: new Date(a.createTime).toLocaleDateString('zh-CN') });
            }
        }
        wrap.innerHTML = '';
        const card = document.createElement('div');
        card.className = 'acct-info-card';
        rows.forEach((r) => {
            const row = document.createElement('div');
            row.className = 'acct-item';
            row.innerHTML = `
        <span class="acct-item-label">${r.label}</span>
        <span class="acct-item-value">${r.cls ? `<span class="music-badge ${r.cls}" style="font-size:11px;padding:1px 8px;">${r.value}</span>` : r.value}</span>
      `;
            card.appendChild(row);
        });
        wrap.appendChild(card);
    }
    catch {
        wrap.innerHTML = '<div style="padding:12px 16px;" class="text-muted text-sm">加载失败</div>';
    }
}
// ============ Stats ============
async function fetchUserStats() {
    try {
        const uid = state.userProfile?.userId;
        if (!uid)
            return;
        const uidStr = String(uid);
        const sub = await api.userSubcount();
        const d = sub.body || sub;
        if (d)
            setStat('as-playlists', String(d.createdPlaylistCount || 0));
        const detail = await api.userDetail(uidStr);
        const p = (detail.body || detail).profile;
        if (p) {
            setStat('as-follows', String(p.follows || 0));
            setStat('as-fans', String(p.followeds || 0));
        }
        const likes = await api.likelist(uidStr);
        const ids = (likes.body || likes).ids;
        if (ids)
            setStat('as-likes', String(ids.length));
    }
    catch { /* silent */ }
}
function setStat(id, val) {
    const el = document.getElementById(id);
    if (el)
        el.textContent = val;
}
function applyTheme(dark) {
    const vars = dark
        ? [['--bg-primary', '#0a0a0f'], ['--bg-secondary', '#12121a'], ['--bg-tertiary', '#1a1a28'], ['--text-primary', '#e8e8f0'], ['--text-secondary', '#8888a0'], ['--border', '#1e1e30']]
        : [['--bg-primary', '#f5f5f7'], ['--bg-secondary', '#ffffff'], ['--bg-tertiary', '#e8e8ed'], ['--text-primary', '#1a1a1a'], ['--text-secondary', '#666666'], ['--border', '#d1d1d6']];
    vars.forEach(([k, val]) => document.documentElement.style.setProperty(k, val));
}
//# sourceMappingURL=account.js.map