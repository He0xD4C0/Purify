// Generic tab switching with Ctrl+Tab keyboard support
export class TabManager {
    constructor(container, tabs, onChange) {
        this.activeIndex = 0;
        this.container = container;
        this.tabs = tabs.filter((t) => t.visible !== false);
        this.onChange = onChange;
        this.render();
    }
    render() {
        this.container.innerHTML = '';
        this.container.className = 'tab-bar';
        this.tabs.forEach((tab, i) => {
            const btn = document.createElement('button');
            btn.className = 'tab-btn' + (i === this.activeIndex ? ' active' : '');
            btn.textContent = tab.label;
            btn.addEventListener('click', () => this.select(i));
            this.container.appendChild(btn);
        });
        // Ctrl+Tab support
        this.container.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Tab') {
                e.preventDefault();
                this.select((this.activeIndex + 1) % this.tabs.length);
            }
        });
    }
    select(index) {
        this.activeIndex = index;
        this.render();
        this.onChange(this.tabs[index].key, index);
    }
    getActiveKey() {
        return this.tabs[this.activeIndex]?.key || '';
    }
}
//# sourceMappingURL=tab-manager.js.map