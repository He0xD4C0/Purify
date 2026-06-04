// Account page — user profile, VIP status, stats, quick links, logout
import { router } from '../core/router.js';
import { bus } from '../core/event-bus.js';
import { state, clearCookie } from '../core/app.js';
import { renderLoginPanel } from '../components/login-panel.js';
import { api } from '../core/api.js';
// ---- Styles (injected once) ----
let stylesInjected = false;
function injectStyles() {
    if (stylesInjected)
        return;
    stylesInjected = true;
    const s = document.createElement('style');
    s.textContent = `
    .acct-card {
      display: flex; align-items: center; gap: 18px;
      padding: 24px; margin-bottom: 20px;
      background: var(--bg-secondary); border-radius: var(--radius-lg);
      border: 1px solid var(--border);
    }
    .acct-avatar {
      width: 72px; height: 72px; border-radius: 50%; object-fit: cover;
      flex-shrink: 0; background: var(--bg-tertiary);
    }
    .acct-name {
      font-size: 22px; font-weight: 700; line-height: 1.2;
    }
    .acct-level {
      display: inline-block; padding: 1px 8px; border-radius: 3px;
      font-size: 11px; font-weight: 600; margin-left: 6px;
      background: var(--bg-hover); color: var(--text-secondary);
    }
    .acct-vip-badge {
      display: inline-block; margin-top: 4px;
    }
    .acct-stats {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
      margin-bottom: 20px;
    }
    .acct-stat {
      text-align: center; padding: 12px 8px;
      background: var(--bg-secondary); border-radius: var(--radius);
      border: 1px solid var(--border);
    }
    .acct-stat-num {
      font-size: 20px; font-weight: 700; color: var(--text-primary);
    }
    .acct-stat-label {
      font-size: 11px; color: var(--text-muted); margin-top: 2px;
    }
    .acct-section {
      margin-bottom: 20px;
    }
    .acct-section-title {
      font-size: 12px; color: var(--text-muted); text-transform: uppercase;
      letter-spacing: 1px; margin-bottom: 8px; padding-left: 4px;
    }
    .acct-menu-item {
      display: flex; justify-content: space-between; align-items: center;
      width: 100%; padding: 14px 16px;
      background: var(--bg-secondary); border: none; border-radius: var(--radius);
      color: var(--text-primary); font-size: 14px; cursor: pointer;
      transition: background var(--transition-fast);
      margin-bottom: 2px; text-align: left;
    }
    .acct-menu-item:hover { background: var(--bg-hover); }
    .acct-menu-item .acct-menu-icon { margin-right: 10px; }
    .acct-menu-item .acct-menu-label { flex: 1; text-align: left; }
    .acct-menu-item .acct-menu-arrow { color: var(--text-muted); font-size: 16px; }
    .acct-menu-item.danger { color: #ff4444; }
    .acct-menu-item.danger:hover { background: rgba(255,68,68,0.08); }
  `;
    document.head.appendChild(s);
}
export function renderAccount(container) {
    injectStyles();
    container.innerHTML = '';
    if (!state.loggedIn) {
        renderLoggedOut(container);
        return;
    }
    renderLoggedIn(container);
}
// ============ Logged-out view ============
function renderLoggedOut(container) {
    container.innerHTML = `
    <div style="text-align:center;padding:40px 20px;">
      <div style="font-size:64px;margin-bottom:16px;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" width="64" height="64" style="color:var(--text-muted);">
          <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-7 8-7s8 3 8 7"/>
        </svg>
      </div>
      <h2 style="font-size:20px;margin-bottom:8px;">登录 Purify</h2>
      <p style="color:var(--text-muted);margin-bottom:24px;font-size:14px;">登录后可同步歌单、获取每日推荐</p>
    </div>
  `;
    renderLoginPanel(container);
}
// ============ Logged-in view ============
function renderLoggedIn(container) {
    const profile = state.userProfile;
    // ---- Profile card ----
    const card = document.createElement('div');
    card.className = 'acct-card';
    card.innerHTML = `
    <img class="acct-avatar" src="${profile.avatarUrl}?param=150y150" alt="">
    <div>
      <div class="acct-name">
        ${profile.nickname}
        <span class="acct-level" id="acct-level">--</span>
      </div>
      <div class="acct-vip-badge" id="acct-vip"></div>
    </div>
  `;
    container.appendChild(card);
    // Render VIP badge
    const vipEl = document.getElementById('acct-vip');
    if (vipEl) {
        const vipType = state.vipType;
        if (vipType === 'svip') {
            vipEl.innerHTML = '<span class="music-badge svip" style="font-size:12px;padding:2px 10px;">黑胶 SVIP</span>';
        }
        else if (vipType === 'vip') {
            vipEl.innerHTML = '<span class="music-badge vip" style="font-size:12px;padding:2px 10px;">VIP</span>';
        }
        else {
            vipEl.innerHTML = '<span style="font-size:12px;color:var(--text-muted);">普通用户</span>';
        }
    }
    // ---- Stats grid ----
    const stats = document.createElement('div');
    stats.className = 'acct-stats';
    stats.innerHTML = `
    <div class="acct-stat"><div class="acct-stat-num" id="stat-follows">--</div><div class="acct-stat-label">关注</div></div>
    <div class="acct-stat"><div class="acct-stat-num" id="stat-fans">--</div><div class="acct-stat-label">粉丝</div></div>
    <div class="acct-stat"><div class="acct-stat-num" id="stat-playlists">--</div><div class="acct-stat-label">歌单</div></div>
    <div class="acct-stat"><div class="acct-stat-num" id="stat-likes">--</div><div class="acct-stat-label">喜欢</div></div>
  `;
    container.appendChild(stats);
    // Fetch stats async
    fetchUserStats();
    // ---- Music library section ----
    const libSection = document.createElement('div');
    libSection.className = 'acct-section';
    libSection.innerHTML = '<div class="acct-section-title">音乐库</div>';
    libSection.appendChild(menuItem('📚', '我的歌单', '', () => router.navigate('library')));
    libSection.appendChild(menuItem('🕐', '最近播放', '', () => router.navigate('library')));
    container.appendChild(libSection);
    // ---- Settings section ----
    const settSection = document.createElement('div');
    settSection.className = 'acct-section';
    settSection.innerHTML = '<div class="acct-section-title">设置</div>';
    settSection.appendChild(menuItem('🔊', '播放设置', '', () => router.navigate('settings')));
    settSection.appendChild(menuItem('🤖', 'AI 翻译', '', () => router.navigate('settings')));
    settSection.appendChild(menuItem('ℹ️', '关于 Purify', '', () => router.navigate('settings')));
    container.appendChild(settSection);
    // ---- Danger zone ----
    const dangerSection = document.createElement('div');
    dangerSection.className = 'acct-section';
    dangerSection.innerHTML = '<div class="acct-section-title">账户操作</div>';
    const logoutBtn = menuItem('', '退出登录', 'danger');
    logoutBtn.addEventListener('click', () => {
        clearCookie();
        state.loggedIn = false;
        state.userProfile = null;
        state.vipType = 'none';
        bus.emit('auth:logout');
        renderAccount(container);
    });
    dangerSection.appendChild(logoutBtn);
    container.appendChild(dangerSection);
}
// ============ Helpers ============
function menuItem(icon, label, cls, onClick) {
    const btn = document.createElement('button');
    btn.className = 'acct-menu-item' + (cls ? ` ${cls}` : '');
    btn.innerHTML = `
    <span class="acct-menu-icon">${icon}</span>
    <span class="acct-menu-label">${label}</span>
    <span class="acct-menu-arrow">›</span>
  `;
    if (onClick)
        btn.addEventListener('click', onClick);
    return btn;
}
async function fetchUserStats() {
    try {
        const uid = state.userProfile?.userId;
        if (!uid)
            return;
        const uidStr = String(uid);
        // Fetch user subcount (playlist count, etc.)
        const subRes = await api.userSubcount();
        const subData = subRes.body || subRes;
        if (subData) {
            setStat('stat-playlists', String(subData.createdPlaylistCount || 0));
        }
        // Fetch user detail for follows/fans + level
        const detailRes = await api.userDetail(uidStr);
        const detailData = detailRes.body || detailRes;
        if (detailData?.profile) {
            setStat('stat-follows', String(detailData.profile.follows ?? 0));
            setStat('stat-fans', String(detailData.profile.followeds ?? 0));
        }
        if (detailData?.level != null) {
            const levelEl = document.getElementById('acct-level');
            if (levelEl)
                levelEl.textContent = `Lv.${detailData.level}`;
        }
        // Fetch liked songs list for count
        const likeRes = await api.likelist(uidStr);
        const likeData = likeRes.body || likeRes;
        if (likeData?.ids) {
            setStat('stat-likes', String(likeData.ids.length));
        }
    }
    catch {
        // Stats fail silently — keep "--"
    }
}
function setStat(id, value) {
    const el = document.getElementById(id);
    if (el)
        el.textContent = value;
}
//# sourceMappingURL=account.js.map