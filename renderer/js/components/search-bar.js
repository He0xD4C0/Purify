// Search bar with suggestions dropdown — embedded in home page top
import { api } from '../core/api.js';
export function createSearchBar(options) {
    const wrapper = document.createElement('div');
    wrapper.className = 'search-bar';
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = '搜索音乐、歌手、歌词...';
    input.autocomplete = 'off';
    // Suggestions dropdown
    const suggestions = document.createElement('div');
    suggestions.className = 'search-suggestions';
    let debounceTimer;
    input.addEventListener('input', () => {
        const value = input.value.trim();
        if (debounceTimer)
            clearTimeout(debounceTimer);
        if (!value) {
            suggestions.classList.remove('visible');
            suggestions.innerHTML = '';
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
                        div.innerHTML = `🔍 <span class="keyword">${item.keyword || item.name}</span>`;
                        div.addEventListener('click', () => {
                            input.value = item.keyword || item.name;
                            suggestions.classList.remove('visible');
                            options.onSearch(input.value);
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
    // Show hot searches on focus when empty
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
                            options.onSearch(item.first);
                        });
                        suggestions.appendChild(div);
                    });
                    suggestions.classList.add('visible');
                }
            }
            catch {
                // ignore
            }
        }
    });
    // Enter = search
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const value = input.value.trim();
            if (value) {
                suggestions.classList.remove('visible');
                options.onSearch(value);
            }
        }
    });
    // Close suggestions on outside click
    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) {
            suggestions.classList.remove('visible');
        }
    });
    wrapper.appendChild(input);
    wrapper.appendChild(suggestions);
    options.container.appendChild(wrapper);
}
//# sourceMappingURL=search-bar.js.map