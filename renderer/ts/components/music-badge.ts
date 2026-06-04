// Reusable music copyright status badge

export type MusicStatus = 'free' | 'vip' | 'svip' | 'purchase' | 'trial' | 'unavailable';

const STATUS_LABELS: Record<MusicStatus, string> = {
  free: '免费',
  vip: 'VIP',
  svip: '黑胶SVIP',
  purchase: '付费',
  trial: '试听',
  unavailable: '不可用',
};

export function renderBadge(status: MusicStatus): HTMLElement {
  const span = document.createElement('span');
  span.className = `music-badge ${status}`;
  span.textContent = STATUS_LABELS[status];
  span.title = STATUS_LABELS[status];

  if (status === 'purchase') {
    span.style.cursor = 'pointer';
    span.addEventListener('click', (e) => {
      e.stopPropagation();
      // Show album purchase guide
      alert('此歌曲需购买专辑。建议前往网易云音乐购买整张专辑。');
    });
  }

  return span;
}

export function detectStatus(fee: number, privilege?: Record<string, unknown>): MusicStatus {
  // fee: 0=free, 1=VIP, 4=purchase, 8=unknown
  // privilege.st/pl/st/maxbr etc.
  if (!privilege) {
    if (fee === 0) return 'free';
    if (fee === 1) return 'vip';
    if (fee === 4) return 'purchase';
    if (fee === 8) return 'unavailable';
    return 'unavailable';
  }

  const pl = privilege.pl as number;
  const dl = privilege.dl as number;
  const st = privilege.st as number;

  if (st === -200) return 'unavailable';
  if (pl === 0 && dl === 0) return 'unavailable';
  if (fee === 0 || pl > 0) return 'free';
  if (fee === 1) return 'vip';
  if (fee === 4) return 'purchase';

  return 'free';
}
