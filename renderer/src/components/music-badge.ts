// Global music badge — render copyright/VIP status labels anywhere

// ---- Song badge types ----
export type MusicStatus = 'free' | 'vip' | 'purchase' | 'unavailable';

const SONG_LABELS: Record<MusicStatus, string> = {
  free: '免费',
  vip: 'VIP',
  purchase: '单曲',
  unavailable: '不可用',
};

const SONG_CLASS: Record<MusicStatus, string> = {
  free: 'free',
  vip: 'vip',
  purchase: 'purchase',
  unavailable: 'unavailable',
};

// ---- User VIP badge types ----
export type UserVipType = 'none' | 'vip' | 'svip' | 'musicbit';

const USER_LABELS: Record<UserVipType, string> = {
  none: '',
  vip: '黑胶VIP',
  svip: '黑胶SVIP',
  musicbit: '畅听会员',
};

const USER_CLASS: Record<UserVipType, string> = {
  none: '',
  vip: 'vip',
  svip: 'svip',
  musicbit: 'vip',
};

/**
 * Render a song badge — VIP / 单曲 / 不可用.
 * Returns null for 'free' (no badge needed).
 */
export function renderBadge(status: MusicStatus): HTMLElement | null {
  if (status === 'free') return null;

  const span = document.createElement('span');
  span.className = `music-badge ${SONG_CLASS[status]}`;
  span.textContent = SONG_LABELS[status];
  span.title = SONG_LABELS[status];

  if (status === 'purchase') {
    span.style.cursor = 'pointer';
    span.addEventListener('click', (e) => {
      e.stopPropagation();
      alert('此歌曲需付费购买，建议前往网易云音乐购买整张专辑。');
    });
  }

  return span;
}

/**
 * Render user VIP badge — attaches after nickname.
 * Returns null for non-VIP users.
 */
export function renderUserVipBadge(vipType: UserVipType): HTMLElement | null {
  if (vipType === 'none') return null;

  const span = document.createElement('span');
  span.className = `music-badge ${USER_CLASS[vipType]}`;
  span.textContent = USER_LABELS[vipType];
  span.title = span.textContent;
  span.style.cssText = 'font-size:12px;padding:2px 10px;vertical-align:middle;margin-left:6px;';
  return span;
}

/**
 * Detect song badge type from fee + privilege data.
 * Pure data classification — no user auth dependency.
 */
export function detectStatus(fee: number, privilege?: Record<string, unknown>): MusicStatus {
  if (!privilege) {
    if (fee === 0 || fee === 8) return 'free';
    if (fee === 1 || fee === 16) return 'vip';
    if (fee === 4) return 'purchase';
    return 'free';
  }

  const pl = privilege.pl as number;
  const dl = privilege.dl as number;
  const st = privilege.st as number;

  if (st === -200) return 'unavailable';
  if (pl === 0 && dl === 0) return 'unavailable';

  if (pl > 0) {
    if (fee === 0 || fee === 8) return 'free';
    if (fee === 1 || fee === 16) return 'vip';
    if (fee === 4) return 'purchase';
    return 'free';
  }

  return 'free';
}
