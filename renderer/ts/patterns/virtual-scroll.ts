// Lightweight virtual scrolling for long lists

interface VirtualScrollOptions {
  container: HTMLElement;
  itemHeight: number;
  renderItem: (index: number) => HTMLElement;
  totalItems: number;
  overscan?: number;
}

export class VirtualScroll {
  private container: HTMLElement;
  private inner: HTMLElement;
  private itemHeight: number;
  private renderItem: (index: number) => HTMLElement;
  private totalItems: number;
  private overscan: number;
  private visibleRange: [number, number] = [0, 0];

  constructor(options: VirtualScrollOptions) {
    this.container = options.container;
    this.itemHeight = options.itemHeight;
    this.renderItem = options.renderItem;
    this.totalItems = options.totalItems;
    this.overscan = options.overscan || 5;

    this.inner = document.createElement('div');
    this.inner.className = 'virtual-scroll-inner';
    this.container.appendChild(this.inner);

    this.container.addEventListener('scroll', () => this.onScroll());
    this.render();
  }

  setTotal(total: number): void {
    this.totalItems = total;
    this.render();
  }

  private onScroll(): void {
    const scrollTop = this.container.scrollTop;
    const viewHeight = this.container.clientHeight;
    const start = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.overscan);
    const end = Math.min(
      this.totalItems,
      Math.ceil((scrollTop + viewHeight) / this.itemHeight) + this.overscan
    );

    if (start !== this.visibleRange[0] || end !== this.visibleRange[1]) {
      this.visibleRange = [start, end];
      this.render();
    }
  }

  private render(): void {
    this.inner.style.height = `${this.totalItems * this.itemHeight}px`;
    this.inner.innerHTML = '';

    const [start, end] = this.visibleRange.length ? this.visibleRange : [0, Math.min(20, this.totalItems)];

    for (let i = start; i < end; i++) {
      const el = this.renderItem(i);
      el.style.position = 'absolute';
      el.style.top = `${i * this.itemHeight}px`;
      el.style.width = '100%';
      this.inner.appendChild(el);
    }
  }
}
