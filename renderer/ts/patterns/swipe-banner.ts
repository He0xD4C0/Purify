// Horizontal sliding banner carousel with touch swipe

interface BannerItem {
  imageUrl: string;
  url?: string;
  typeTitle?: string;
}

export class SwipeBanner {
  private container: HTMLElement;
  private track: HTMLElement | null = null;
  private dots: HTMLElement | null = null;
  private items: BannerItem[] = [];
  private current: number = 0;
  private timer: number | null = null;
  private interval: number;
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private isDragging: boolean = false;
  private dragOffset: number = 0;

  constructor(container: HTMLElement, interval = 4000) {
    this.container = container;
    this.interval = interval;
    this.buildDOM();
    this.bindTouch();
  }

  private buildDOM(): void {
    this.container.innerHTML = '';

    const viewport = document.createElement('div');
    viewport.className = 'banner-viewport';

    this.track = document.createElement('div');
    this.track.className = 'banner-track';
    viewport.appendChild(this.track);

    this.dots = document.createElement('div');
    this.dots.className = 'banner-dots';
    viewport.appendChild(this.dots);

    this.container.appendChild(viewport);
  }

  setItems(items: BannerItem[]): void {
    this.items = items;
    this.current = 0;
    this.renderSlides();
    this.updatePosition(false);
    this.renderDots();
    this.startAuto();
  }

  private renderSlides(): void {
    if (!this.track) return;
    this.track.innerHTML = '';

    this.items.forEach((item, i) => {
      const slide = document.createElement('div');
      slide.className = 'banner-slide';
      slide.addEventListener('click', () => {
        if (!this.isDragging && item.url) {
          window.open(item.url, '_blank');
        }
      });

      const img = document.createElement('img');
      img.src = item.imageUrl;
      img.alt = item.typeTitle || '';
      img.draggable = false;
      img.loading = 'lazy';
      slide.appendChild(img);
      this.track!.appendChild(slide);
    });
  }

  private renderDots(): void {
    if (!this.dots) return;
    this.dots.innerHTML = '';

    this.items.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'banner-dot' + (i === this.current ? ' active' : '');
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        this.goTo(i);
      });
      this.dots!.appendChild(dot);
    });
  }

  private updatePosition(animate: boolean): void {
    if (!this.track) return;
    this.track.style.transition = animate ? 'transform 0.4s ease' : 'none';
    this.track.style.transform = `translateX(-${this.current * 100}%)`;

    // Update dots
    const dots = this.container.querySelectorAll('.banner-dot');
    dots.forEach((d, i) => d.classList.toggle('active', i === this.current));
  }

  goTo(index: number): void {
    this.current = index;
    this.updatePosition(true);
    this.resetAuto();
  }

  next(): void {
    this.goTo((this.current + 1) % this.items.length);
  }

  prev(): void {
    this.goTo((this.current - 1 + this.items.length) % this.items.length);
  }

  private bindTouch(): void {
    if (!this.track) return;

    this.track.addEventListener('touchstart', (e: TouchEvent) => {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
      this.isDragging = false;
      this.dragOffset = 0;
      this.stopAuto();
    }, { passive: true });

    this.track.addEventListener('touchmove', (e: TouchEvent) => {
      const dx = e.touches[0].clientX - this.touchStartX;
      const dy = Math.abs(e.touches[0].clientY - this.touchStartY);

      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
        this.isDragging = true;
        e.preventDefault();
        this.dragOffset = dx;
        this.track!.style.transition = 'none';
        const pct = -(this.current * 100) + (dx / this.container.offsetWidth) * 100;
        this.track!.style.transform = `translateX(${pct}%)`;
      }
    }, { passive: false });

    this.track.addEventListener('touchend', () => {
      if (this.isDragging) {
        if (Math.abs(this.dragOffset) > 60) {
          if (this.dragOffset > 0) this.prev();
          else this.next();
        } else {
          this.updatePosition(true);
        }
        this.isDragging = false;
      }
      this.startAuto();
    });
  }

  startAuto(): void {
    if (this.timer) return;
    this.timer = window.setInterval(() => this.next(), this.interval);
  }

  stopAuto(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  resetAuto(): void {
    this.stopAuto();
    this.startAuto();
  }

  destroy(): void {
    this.stopAuto();
  }
}
