// Navigation bar — 5 tabs: Home, Player, Library, Account, Settings

import { router } from '../core/router.js';
import { bus } from '../core/event-bus.js';

// SVG icons — 24x24 viewBox, stroke-based, inherit currentColor
const ICONS: Record<string, string> = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.2 7.8 14.1 14.1 7.8 16.2 9.9 9.9 16.2 7.8"/></svg>',
  player: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16" fill="currentColor" stroke="none"/></svg>',
  library: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  account: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-7 8-7s8 3 8 7"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.2 4.2l2.8 2.8M17 17l2.8 2.8M1 12h4M19 12h4M4.2 19.8l2.8-2.8M17 7l2.8-2.8"/></svg>',
};

const TABS = [
  { key: 'home', label: '发现' },
  { key: 'player', label: '播放' },
  { key: 'library', label: '曲库' },
  { key: 'account', label: '账户' },
  { key: 'settings', label: '设置' },
];

export function initNavbar(): void {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  navbar.innerHTML = '';

  TABS.forEach((tab) => {
    const btn = document.createElement('button');
    btn.className = 'nav-tab';

    // Square icon slot — left side
    const iconEl = document.createElement('span');
    iconEl.className = 'nav-icon';
    iconEl.innerHTML = ICONS[tab.key];

    // Text label — right side, left-aligned
    const labelEl = document.createElement('span');
    labelEl.className = 'nav-label';
    labelEl.textContent = tab.label;

    btn.appendChild(iconEl);
    btn.appendChild(labelEl);

    btn.addEventListener('click', () => {
      router.navigate(tab.key);
    });
    navbar.appendChild(btn);
  });

  // Highlight active tab
  const updateActive = (page: string) => {
    const tabs = navbar.querySelectorAll('.nav-tab');
    tabs.forEach((t, i) => {
      t.classList.toggle('active', TABS[i].key === page);
    });
  };

  bus.on('nav:page', updateActive);

  // Initial state
  updateActive(router.current());
}
