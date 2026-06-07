// Global Auth module — single source of truth for login state & cookie management
import { bus } from './event-bus.js';
import { api } from './api.js';
const COOKIE_KEY = 'purify_cookie';
export const auth = {
    loggedIn: false,
    vipType: 'none',
    userProfile: null,
};
// ---- Cookie ----
export function getCookie() {
    return localStorage.getItem(COOKIE_KEY) || '';
}
export function saveCookie(cookie) {
    localStorage.setItem(COOKIE_KEY, cookie);
}
export function clearCookie() {
    localStorage.removeItem(COOKIE_KEY);
}
// ---- Init: check stored cookie ----
export async function checkLogin() {
    const cookie = getCookie();
    if (!cookie) {
        auth.loggedIn = false;
        return;
    }
    try {
        const res = await api.loginStatus();
        if (res.data?.account) {
            auth.loggedIn = true;
            auth.userProfile = {
                userId: res.data.account.id,
                nickname: res.data.profile?.nickname || '',
                avatarUrl: res.data.profile?.avatarUrl || '',
                signature: res.data.profile?.signature || '',
            };
            auth.vipType = res.data.profile?.vipType === 11 ? 'svip'
                : res.data.profile?.vipType === 10 ? 'vip' : 'none';
            bus.emit('auth:login', auth.userProfile);
            return;
        }
        // Server confirmed token expired/invalid — clear it
        clearCookie();
    }
    catch {
        // Network error — keep cookie, keep previous state
    }
    auth.loggedIn = false;
}
// ---- Logout ----
export function logout() {
    auth.loggedIn = false;
    auth.loggedIn = false;
    auth.userProfile = null;
    auth.vipType = 'none';
    bus.emit('auth:logout');
}
//# sourceMappingURL=auth.js.map