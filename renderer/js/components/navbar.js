// Navigation bar — 5 tabs: Home, Player, Library, Account, Settings
import { router } from '../core/router.js';
import { bus } from '../core/event-bus.js';
const TABS = [
    { key: 'home', label: '发现', icon: '🏠' },
    { key: 'player', label: '播放', icon: '🎵' },
    { key: 'library', label: '曲库', icon: '📚' },
    { key: 'account', label: '账户', icon: '👤' },
    { key: 'settings', label: '设置', icon: '⚙️' },
];
export function initNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar)
        return;
    navbar.innerHTML = '';
    TABS.forEach((tab) => {
        const btn = document.createElement('button');
        btn.className = 'nav-tab';
        btn.innerHTML = `${tab.icon} ${tab.label}`;
        btn.addEventListener('click', () => {
            router.navigate(tab.key);
        });
        navbar.appendChild(btn);
    });
    // Highlight active tab
    const updateActive = (page) => {
        const tabs = navbar.querySelectorAll('.nav-tab');
        tabs.forEach((t, i) => {
            t.classList.toggle('active', TABS[i].key === page);
        });
    };
    bus.on('nav:page', updateActive);
    // Initial state
    updateActive(router.current());
}
//# sourceMappingURL=navbar.js.map