// Lightweight virtual scrolling for long lists
export class VirtualScroll {
    constructor(options) {
        this.visibleRange = [0, 0];
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
    setTotal(total) {
        this.totalItems = total;
        this.render();
    }
    onScroll() {
        const scrollTop = this.container.scrollTop;
        const viewHeight = this.container.clientHeight;
        const start = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.overscan);
        const end = Math.min(this.totalItems, Math.ceil((scrollTop + viewHeight) / this.itemHeight) + this.overscan);
        if (start !== this.visibleRange[0] || end !== this.visibleRange[1]) {
            this.visibleRange = [start, end];
            this.render();
        }
    }
    render() {
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
//# sourceMappingURL=virtual-scroll.js.map