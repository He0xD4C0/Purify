// Global search bar — always visible at top of app, across all pages
// Includes back/forward navigation buttons
import { api } from '../core/api.js';
export function initSearchBar() {
    const container = document.getElementById('search-bar');
    if (!container)
        return;
    // ---- Back / Forward nav buttons ----
    const backBtn = document.createElement('button');
    backBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><polyline points="15 18 9 12 15 6"/></svg>';
    backBtn.title = '后退';
    backBtn.className = 'search-nav-btn';
    backBtn.addEventListener('click', () => history.back());
    const fwdBtn = document.createElement('button');
    fwdBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><polyline points="9 18 15 12 9 6"/></svg>';
    fwdBtn.title = '前进';
    fwdBtn.className = 'search-nav-btn';
    fwdBtn.addEventListener('click', () => history.forward());
    function updateNavButtons() {
        const nav = window.navigation;
        backBtn.style.opacity = (nav ? nav.canGoBack : history.length > 1) ? '' : '0.35';
        const canFwd = nav ? nav.canGoForward : false;
        fwdBtn.style.opacity = canFwd ? '' : '0.35';
        fwdBtn.disabled = !canFwd;
    }
    updateNavButtons();
    window.addEventListener('popstate', () => updateNavButtons());
    // ---- Search input ----
    const wrapper = document.createElement('div');
    wrapper.className = 'search-bar';
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = '搜索音乐、歌手、歌词...';
    input.autocomplete = 'off';
    const suggestions = document.createElement('div');
    suggestions.className = 'search-suggestions';
    let debounceTimer;
    input.addEventListener('input', () => {
        const value = input.value.trim();
        if (debounceTimer)
            clearTimeout(debounceTimer);
        if (!value) {
            suggestions.classList.remove('visible');
            return;
        }
        debounceTimer = window.setTimeout(async () => {
            try {
                const res = await api.searchSuggest(value);
                const items = res.result?.allMatch || res.result?.songs || [];
                suggestions.innerHTML = '';
                if (items.length > 0) {
                    items.slice(0, 8).forEach((item) => {
                        const div = document.createElement('div');
                        div.className = 'suggestion-item';
                        div.innerHTML = '<span class="keyword">' + (item.keyword || item.name) + '</span>';
                        div.addEventListener('click', () => {
                            input.value = item.keyword || item.name;
                            suggestions.classList.remove('visible');
                            doSearch(input.value);
                        });
                        suggestions.appendChild(div);
                    });
                    suggestions.classList.add('visible');
                }
                else {
                    suggestions.classList.remove('visible');
                }
            }
            catch {
                suggestions.classList.remove('visible');
            }
        }, 300);
    });
    // Focus: hot searches when empty
    input.addEventListener('focus', async () => {
        if (!input.value.trim()) {
            try {
                const res = await api.searchHot();
                const hots = res.result?.hots || [];
                suggestions.innerHTML = '';
                if (hots.length > 0) {
                    hots.slice(0, 10).forEach((item) => {
                        const div = document.createElement('div');
                        div.className = 'suggestion-item';
                        div.textContent = item.first;
                        div.addEventListener('click', () => {
                            input.value = item.first;
                            suggestions.classList.remove('visible');
                            doSearch(item.first);
                        });
                        suggestions.appendChild(div);
                    });
                    suggestions.classList.add('visible');
                }
            }
            catch { /* ignore */ }
        }
    });
    // Enter = search + blur
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const value = input.value.trim();
            if (value) {
                suggestions.classList.remove('visible');
                doSearch(value);
            }
            input.blur();
        }
    });
    // Click outside = close suggestions
    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target) && !backBtn.contains(e.target) && !fwdBtn.contains(e.target)) {
            suggestions.classList.remove('visible');
        }
    });
    wrapper.appendChild(input);
    wrapper.appendChild(suggestions);
    container.innerHTML = '';
    container.appendChild(backBtn);
    container.appendChild(fwdBtn);
    container.appendChild(wrapper);
}
/** Navigate to dedicated search page */
function doSearch(keywords) {
    location.hash = `search?q=${encodeURIComponent(keywords)}`;
}
//# sourceMappingURL=search-bar.js.map