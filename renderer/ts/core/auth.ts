// Global Auth module — single source of truth for login state & cookie management

import { bus } from './event-bus.js';
import { api } from './api.js';

const COOKIE_KEY = 'purify_cookie';

export interface UserProfile {
  userId: number;
  nickname: string;
  avatarUrl: string;
  signature: string;
}

export interface AuthState {
  loggedIn: boolean;
  vipType: 'none' | 'vip' | 'svip';
  userProfile: UserProfile | null;
}

export const auth: AuthState = {
  loggedIn: false,
  vipType: 'none',
  userProfile: null,
};

// ---- Cookie ----

export function getCookie(): string {
  return localStorage.getItem(COOKIE_KEY) || '';
}

export function saveCookie(cookie: string): void {
  localStorage.setItem(COOKIE_KEY, cookie);
}

export function clearCookie(): void {
  localStorage.removeItem(COOKIE_KEY);
}

// ---- Init: check stored cookie ----

export async function checkLogin(): Promise<void> {
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
    // Server responded but no account — only clear if server confirms token invalid (code 301)
    // Otherwise keep cookie (transient server issue)
    if (res.data?.code === 301) clearCookie();
  } catch {
    // Network error / server unreachable — keep cookie, retry next time
  }
  auth.loggedIn = false;
}

// ---- Logout ----

export function logout(): void {
  clearCookie();
  auth.loggedIn = false;
  auth.userProfile = null;
  auth.vipType = 'none';
  bus.emit('auth:logout');
}
