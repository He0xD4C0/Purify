// Generic tab switching with Ctrl+Tab keyboard support

interface TabConfig {
  key: string;
  label: string;
  visible?: boolean;
}

export class TabManager {
  private container: HTMLElement;
  private tabs: TabConfig[];
  private activeIndex: number = 0;
  private onChange: (key: string, index: number) => void;

  constructor(
    container: HTMLElement,
    tabs: TabConfig[],
    onChange: (key: string, index: number) => void
  ) {
    this.container = container;
    this.tabs = tabs.filter((t) => t.visible !== false);
    this.onChange = onChange;
    this.render();
  }

  private render(): void {
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

  select(index: number): void {
    this.activeIndex = index;
    this.render();
    this.onChange(this.tabs[index].key, index);
  }

  getActiveKey(): string {
    return this.tabs[this.activeIndex]?.key || '';
  }
}
