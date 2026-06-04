// Carousel banner with auto-advance, dot indicators, and touch swipe

interface BannerItem {
  imageUrl: string;
  url?: string;
  titleColor?: string;
  typeTitle?: string;
}

export class SwipeBanner {
  private container: HTMLElement;
  private items: BannerItem[] = [];
  private current: number = 0;
  private timer: number | null = null;
  private interval: number;
  private touchStartX: number = 0;
  private touchStartY: number = 0;

  constructor(container: HTMLElement, interval = 4000) {
    this.container = container;
    this.interval = interval;
    this.container.className = 'swipe-banner';
    this.bindTouch();
  }

  setItems(items: BannerItem[]): void {
    this.items = items;
    this.current = 0;
    this.render();
    this.startAuto();
  }

  private bindTouch(): void {
    this.container.addEventListener('touchstart', (e) => {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
      this.stopAuto();
    }, { passive: true });

    this.container.addEventListener('touchend', (e) => {
      const dx = (e as TouchEvent).changedTouches[0].clientX - this.touchStartX;
      const dy = (e as TouchEvent).changedTouches[0].clientY - this.touchStartY;

      // Only trigger swipe if horizontal movement > vertical and > 50px
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
        if (dx > 0) {
          this.prev();
        } else {
          this.next();
        }
      }
      this.startAuto();
    });
  }

  private render(): void {
    this.container.innerHTML = '';

    const slides = document.createElement('div');
    slides.id = 'banner-container';

    this.items.forEach((item, i) => {
      const slide = document.createElement('div');
      slide.className = 'banner-slide' + (i === this.current ? ' active' : '');
      slide.addEventListener('click', () => {
        if (item.url) window.open(item.url, '_blank');
      });
      const img = document.createElement('img');
      img.src = item.imageUrl;
      img.alt = item.typeTitle || '';
      img.loading = 'lazy';
      img.draggable = false;
      slide.appendChild(img);
      slides.appendChild(slide);
    });

    // Dots — pill style active indicator
    const dots = document.createElement('div');
    dots.className = 'banner-dots';
    this.items.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'banner-dot' + (i === this.current ? ' active' : '');
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        this.goTo(i);
      });
      dots.appendChild(dot);
    });

    slides.appendChild(dots);
    this.container.appendChild(slides);
  }

  goTo(index: number): void {
    this.current = index;
    const slides = this.container.querySelectorAll('.banner-slide');
    const dots = this.container.querySelectorAll('.banner-dot');
    slides.forEach((s, i) => s.classList.toggle('active', i === index));
    dots.forEach((d, i) => d.classList.toggle('active', i === index));
    this.resetAuto();
  }

  next(): void {
    this.goTo((this.current + 1) % this.items.length);
  }

  prev(): void {
    this.goTo((this.current - 1 + this.items.length) % this.items.length);
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
