// Directional overlay panel with spring physics animation (touch platforms only)
const THRESHOLD = 0.3; // 30% drag to trigger open/close
export class SwipePanel {
    constructor(options) {
        this.isOpen = false;
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.currentTranslate = 0;
        this.container = options.container;
        this.direction = options.direction;
        this.onOpen = options.onOpen;
        this.onClose = options.onClose;
        // Find the panel element inside container
        this.panel = this.container.querySelector('.player-panel');
        if (!this.panel)
            throw new Error('SwipePanel: .player-panel child required');
        // Only enable touch on touch-capable devices
        if ('ontouchstart' in window) {
            this.bindTouch();
        }
    }
    bindTouch() {
        this.container.addEventListener('touchstart', (e) => this.onTouchStart(e));
        this.container.addEventListener('touchmove', (e) => this.onTouchMove(e));
        this.container.addEventListener('touchend', () => this.onTouchEnd());
    }
    onTouchStart(e) {
        this.isDragging = true;
        this.startX = e.touches[0].clientX;
        this.startY = e.touches[0].clientY;
    }
    onTouchMove(e) {
        if (!this.isDragging)
            return;
        const dx = e.touches[0].clientX - this.startX;
        const dy = e.touches[0].clientY - this.startY;
        if (this.direction === 'left') {
            this.currentTranslate = Math.min(0, dx);
        }
        else if (this.direction === 'right') {
            this.currentTranslate = Math.max(0, dx);
        }
        else {
            this.currentTranslate = Math.max(0, dy);
        }
        this.panel.style.transition = 'none';
        this.panel.style.transform = this.getTransform(this.currentTranslate);
    }
    onTouchEnd() {
        this.isDragging = false;
        this.panel.style.transition = 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
        const panelSize = this.direction === 'bottom'
            ? this.container.clientHeight
            : this.container.clientWidth;
        const ratio = Math.abs(this.currentTranslate) / panelSize;
        if (ratio > THRESHOLD) {
            if (this.currentTranslate > 0) {
                this.close();
            }
            else {
                this.close();
            }
        }
        else {
            this.close();
        }
    }
    getTransform(translate) {
        switch (this.direction) {
            case 'left': return `translateX(${translate}px)`;
            case 'right': return `translateX(${translate}px)`;
            case 'bottom': return `translateY(${translate}px)`;
        }
    }
    toggle() {
        this.isOpen ? this.close() : this.open();
    }
    open() {
        this.isOpen = true;
        this.panel.classList.add('open');
        this.onOpen?.();
    }
    close() {
        this.isOpen = false;
        this.panel.classList.remove('open');
        this.onClose?.();
    }
}
//# sourceMappingURL=swipe-panel.js.map