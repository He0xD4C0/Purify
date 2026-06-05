// Global music badge — render copyright/VIP status labels anywhere

export type MusicStatus = 'free' | 'vip' | 'svip' | 'purchase' | 'trial' | 'unavailable';

const LABELS: Record<MusicStatus, string> = {
  free: '免费',
  vip: 'VIP',
  svip: '黑胶SVIP',
  purchase: '付费',
  trial: '畅听',
  unavailable: '不可用',
};

const CLASS_MAP: Record<MusicStatus, string> = {
  free: 'free',
  vip: 'vip',
  svip: 'svip',
  purchase: 'purchase',
  trial: 'trial',
  unavailable: 'unavailable',
};

/**
 * Render a badge element for a given music status.
 * Returns null for 'free' status (no badge needed).
 * Use this anywhere a copyright/VIP badge needs to appear.
 */
export function renderBadge(status: MusicStatus): HTMLElement | null {
  if (status === 'free') return null;

  const span = document.createElement('span');
  span.className = `music-badge ${CLASS_MAP[status]}`;
  span.textContent = LABELS[status];
  span.title = LABELS[status];

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
 * Render a user VIP badge — for attaching after user nickname.
 * Returns null for non-VIP users.
 */
export function renderUserVipBadge(vipType: 'none' | 'vip' | 'svip'): HTMLElement | null {
  if (vipType === 'none') return null;

  const span = document.createElement('span');
  span.className = `music-badge ${vipType === 'svip' ? 'svip' : 'vip'}`;
  span.textContent = vipType === 'svip' ? '黑胶SVIP' : '黑胶VIP';
  span.title = span.textContent;
  span.style.cssText = 'font-size:12px;padding:2px 10px;vertical-align:middle;margin-left:6px;';
  return span;
}

/**
 * Detect music status from fee and privilege data.
 * Does NOT depend on user auth state — purely data classification.
 */
export function detectStatus(fee: number, privilege?: Record<string, unknown>): MusicStatus {
  if (!privilege) {
    if (fee === 0) return 'free';
    if (fee === 1) return 'vip';
    if (fee === 4) return 'purchase';
    if (fee === 8) return 'free';
    if (fee === 16) return 'svip';
    return 'free';
  }

  const pl = privilege.pl as number;
  const dl = privilege.dl as number;
  const st = privilege.st as number;

  if (st === -200) return 'unavailable';
  if (pl === 0 && dl === 0) return 'unavailable';
  if (fee === 0 || pl > 0) {
    if (fee === 0) return 'free';
    if (fee === 1) return 'vip';
    if (fee === 4) return 'purchase';
    if (fee === 16) return 'svip';
    return 'free';
  }

  return 'free';
}
