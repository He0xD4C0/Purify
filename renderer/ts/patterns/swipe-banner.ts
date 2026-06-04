// Horizontal sliding banner carousel with touch swipe

interface BannerItem {
  imageUrl: string;
  url?: string;
  typeTitle?: string;
}

const BANNER_IMG_HEIGHT = 220; // fixed image height, width derived from ratio

export class SwipeBanner {
  private container: HTMLElement;
  private track: HTMLElement | null = null;
  private dots: HTMLElement | null = null;
  private viewport: HTMLElement | null = null;
  private items: BannerItem[] = [];
  private current: number = 0;
  private timer: number | null = null;
  private interval: number;
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private isDragging: boolean = false;
  private dragOffset: number = 0;
  private loaded: boolean = false;

  constructor(container: HTMLElement, interval = 4000) {
    this.container = container;
    this.interval = interval;
    this.container.style.position = 'relative';
    this.buildDOM();
    this.bindTouch();
  }

  private buildDOM(): void {
    this.container.innerHTML = '';

    this.viewport = document.createElement('div');
    this.viewport.className = 'banner-viewport';

    this.track = document.createElement('div');
    this.track.className = 'banner-track';
    this.viewport.appendChild(this.track);

    // Gradient mask overlays — left and right
    const maskLeft = document.createElement('div');
    maskLeft.className = 'banner-mask banner-mask-left';
    this.viewport.appendChild(maskLeft);

    const maskRight = document.createElement('div');
    maskRight.className = 'banner-mask banner-mask-right';
    this.viewport.appendChild(maskRight);

    this.dots = document.createElement('div');
    this.dots.className = 'banner-dots';

    this.container.appendChild(this.viewport);
    this.container.appendChild(this.dots);
  }

  private isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  setItems(items: BannerItem[]): void {
    this.items = items;
    this.current = 0;
    this.loaded = false;
    this.renderSlides();
  }

  private renderSlides(): void {
    if (!this.track) return;
    this.track.innerHTML = '';

    let loadedCount = 0;

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

      // On load: set fixed height, calculate width from ratio
      img.onload = () => {
        const ratio = img.naturalWidth / img.naturalHeight;
        img.style.height = `${BANNER_IMG_HEIGHT}px`;
        img.style.width = `${Math.round(BANNER_IMG_HEIGHT * ratio)}px`;

        loadedCount++;
        if (loadedCount === this.items.length && !this.loaded) {
          this.loaded = true;
          this.addCenteringPads();
          this.renderDots();
          this.updatePosition(false);
          this.startAuto();
        }
      };

      img.onerror = () => {
        loadedCount++;
        if (loadedCount === this.items.length && !this.loaded) {
          this.loaded = true;
          this.renderDots();
          this.updatePosition(false);
          this.startAuto();
        }
      };

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
    if (!this.track || !this.viewport) return;
    const gap = this.getGap();
    const slides = this.track.querySelectorAll('.banner-slide') as NodeListOf<HTMLElement>;
    if (slides.length === 0 || !slides[this.current]) return;

    // Sum widths + gaps of all slides before current
    let scrollTarget = 0;
    for (let i = 0; i < this.current; i++) {
      scrollTarget += slides[i].offsetWidth + gap;
    }

    this.viewport.style.scrollBehavior = animate ? 'smooth' : 'auto';
    this.viewport.scrollLeft = scrollTarget;

    // Update masks
    this.updateMasks();

    // Update dots
    const dots = this.container.querySelectorAll('.banner-dot');
    dots.forEach((d, i) => d.classList.toggle('active', i === this.current));
  }

  private updateMasks(): void {
    if (!this.viewport || !this.track) return;
    const slides = this.track.querySelectorAll('.banner-slide') as NodeListOf<HTMLElement>;
    if (!slides[this.current]) return;

    const currentSlide = slides[this.current];
    const vw = this.viewport.offsetWidth;
    const imageW = currentSlide.offsetWidth;
    const maskW = Math.max(0, (vw - imageW) / 2);

    const maskLeft = this.viewport.querySelector('.banner-mask-left') as HTMLElement;
    const maskRight = this.viewport.querySelector('.banner-mask-right') as HTMLElement;
    if (maskLeft) maskLeft.style.width = `${maskW}px`;
    if (maskRight) maskRight.style.width = `${maskW}px`;
  }

  private getGap(): number {
    if (!this.track) return 16;
    const cs = getComputedStyle(this.track);
    return parseInt(cs.gap) || parseInt(cs.columnGap) || 16;
  }

  private addCenteringPads(): void {
    if (!this.track || !this.viewport) return;
    const slides = this.track.querySelectorAll('.banner-slide');
    if (slides.length === 0) return;

    const firstSlide = slides[0] as HTMLElement;
    const lastSlide = slides[slides.length - 1] as HTMLElement;

    // Set track padding so first slide can be centered when scrollLeft=0
    const halfPad = Math.max(0, (this.viewport.offsetWidth - firstSlide.offsetWidth) / 2);
    this.track.style.paddingLeft = `${halfPad}px`;

    // Add spacer after last slide so it can be centered at max scroll
    const endPad = Math.max(0, (this.viewport.offsetWidth - lastSlide.offsetWidth) / 2);
    const spacer = document.createElement('div');
    spacer.className = 'banner-spacer';
    spacer.style.cssText = `flex-shrink:0; width:${endPad}px; height:1px;`;
    this.track.appendChild(spacer);
  }

  goTo(index: number): void {
    this.current = index;
    this.updatePosition(true);
    this.resetAuto();
  }

  next(): void {
    this.syncCurrentFromScroll();
    this.goTo((this.current + 1) % this.items.length);
  }

  prev(): void {
    this.syncCurrentFromScroll();
    this.goTo((this.current - 1 + this.items.length) % this.items.length);
  }

  // Read scrollLeft and determine which slide's center is closest to viewport center
  private syncCurrentFromScroll(): void {
    if (!this.viewport || !this.track) return;
    const scrollLeft = this.viewport.scrollLeft;
    const vw = this.viewport.offsetWidth;
    const vpCenter = vw / 2;
    const padLeft = parseInt(getComputedStyle(this.track).paddingLeft) || 0;
    const gap = this.getGap();
    const slides = this.track.querySelectorAll('.banner-slide') as NodeListOf<HTMLElement>;
    if (slides.length === 0) return;

    let bestIdx = 0;
    let bestDist = Infinity;
    let cumX = padLeft - scrollLeft;

    for (let i = 0; i < slides.length; i++) {
      const sw = slides[i].offsetWidth;
      const center = cumX + sw / 2;
      const dist = Math.abs(center - vpCenter);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
      cumX += sw + gap;
    }

    this.current = bestIdx;
  }

  private bindTouch(): void {
    if (!this.track || !this.viewport) return;

    // Touch events
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

        const gap = this.getGap();
        const slides = this.track!.querySelectorAll('.banner-slide');
        let baseScroll = 0;
        for (let i = 0; i < this.current && i < slides.length; i++) {
          baseScroll += (slides[i] as HTMLElement).offsetWidth + gap;
        }
        this.viewport!.style.scrollBehavior = 'auto';
        this.viewport!.scrollLeft = baseScroll - dx;
      }
    }, { passive: false });

    this.track.addEventListener('touchend', () => {
      if (this.isDragging) {
        this.syncCurrentFromScroll();
        this.updatePosition(true);
        this.isDragging = false;
      }
      this.startAuto();
    });

    // Trackpad / mousewheel scroll on the viewport
    let scrollTimer: number | null = null;
    this.viewport.addEventListener('scroll', () => {
      // Only respond if this wasn't triggered programmatically
      if (this.isDragging) return;

      this.stopAuto();
      if (scrollTimer) clearTimeout(scrollTimer);

      // After scrolling stops, snap to nearest and restart timer
      scrollTimer = window.setTimeout(() => {
        this.syncCurrentFromScroll();
        this.updatePosition(true);
        this.renderDots();
        this.startAuto();
      }, 2000);
    }, { passive: true });
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
