// Hierarchical navigation: wide screen = side-by-side columns (macOS Finder style)
// narrow screen = push overlay with back button

interface ColumnNavItem {
  id: string;
  label: string;
  render?: (container: HTMLElement) => void;  // undefined = inline item
  inline?: (el: HTMLElement) => void;         // render inline content (toggle, button)
}

export class ColumnNav {
  private root: HTMLElement;
  private items: ColumnNavItem[];
  private activeItem: string | null = null;
  private isWide: boolean;

  constructor(root: HTMLElement, items: ColumnNavItem[]) {
    this.root = root;
    this.items = items;
    this.isWide = window.innerWidth >= 800;
    this.render();
    this.bindResize();
  }

  private bindResize(): void {
    window.addEventListener('resize', () => {
      const wasWide = this.isWide;
      this.isWide = window.innerWidth >= 800;
      if (wasWide !== this.isWide) this.render();
    });
  }

  private render(): void {
    this.root.innerHTML = '';
    this.root.className = this.isWide ? 'column-nav wide' : 'column-nav narrow';

    if (this.isWide) {
      this.renderWide();
    } else {
      this.renderNarrow();
    }
  }

  private renderWide(): void {
    // Left column: category list
    const leftCol = document.createElement('div');
    leftCol.className = 'column-nav-left';

    this.items.forEach((item) => {
      if (item.inline) {
        // Inline item — render inline action (toggle/button)
        const row = document.createElement('div');
        row.className = 'column-nav-item column-nav-inline';
        row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;';
        const label = document.createElement('span');
        label.textContent = item.label;
        row.appendChild(label);
        item.inline(row);
        leftCol.appendChild(row);
      } else {
        // Navigable item
        const btn = document.createElement('button');
        btn.className = 'column-nav-item' + (item.id === this.activeItem ? ' active' : '');
        btn.textContent = item.label;
        btn.addEventListener('click', () => {
          this.activeItem = item.id;
          this.render();
        });
        leftCol.appendChild(btn);
      }
    });

    this.root.appendChild(leftCol);

    // Right column: active item content
    if (this.activeItem) {
      const rightCol = document.createElement('div');
      rightCol.className = 'column-nav-right';
      const activeItem = this.items.find((i) => i.id === this.activeItem);
      if (activeItem?.render) {
        activeItem.render(rightCol);
      }
      this.root.appendChild(rightCol);
    }
  }

  private renderNarrow(): void {
    if (this.activeItem) {
      // Show sub-page with back button
      const backBtn = document.createElement('button');
      backBtn.className = 'column-nav-back';
      backBtn.textContent = '← 返回';
      backBtn.addEventListener('click', () => {
        this.activeItem = null;
        this.render();
      });
      this.root.appendChild(backBtn);

      const content = document.createElement('div');
      content.className = 'column-nav-content';
      const activeItem = this.items.find((i) => i.id === this.activeItem);
      if (activeItem?.render) {
        activeItem.render(content);
      }
      this.root.appendChild(content);
    } else {
      // Show category list
      const list = document.createElement('div');
      list.className = 'column-nav-list';

      this.items.forEach((item) => {
        if (item.inline) {
          // Inline item
          const row = document.createElement('div');
          row.className = 'column-nav-item column-nav-inline';
          row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:14px 16px;';
          const label = document.createElement('span');
          label.textContent = item.label;
          row.appendChild(label);
          item.inline(row);
          list.appendChild(row);
        } else {
          // Navigable item
          const btn = document.createElement('button');
          btn.className = 'column-nav-item';
          btn.innerHTML = `
            <span>${item.label}</span>
            <span class="column-nav-arrow">›</span>
          `;
          btn.addEventListener('click', () => {
            this.activeItem = item.id;
            this.render();
          });
          list.appendChild(btn);
        }
      });

      this.root.appendChild(list);
    }
  }
}
