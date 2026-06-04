// Horizontal sliding banner carousel with touch swipe
// Desktop: fixed image height 220px, centering pads, gradient masks
// Mobile (<900px): image fills viewport width, proportional height, no masks

interface BannerItem {
  imageUrl: string;
  url?: string;
  typeTitle?: string;
}

const BANNER_IMG_HEIGHT = 220;
const MOBILE_BREAKPOINT = 900;

export class SwipeBanner {
  private container: HTMLElement;
  private track: HTMLElement | null = null;
  private dots: HTMLElement | null = null;
  private viewport: HTMLElement | null = null;
  private maskLeft: HTMLElement | null = null;
  private maskRight: HTMLElement | null = null;
  private items: BannerItem[] = [];
  private current: number = 0;
  private timer: number | null = null;
  private interval: number;
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private isDragging: boolean = false;
  private dragOffset: number = 0;
  private loaded: boolean = false;
  private wasNarrow: boolean;

  constructor(container: HTMLElement, interval = 4000) {
    this.container = container;
    this.interval = interval;
    this.wasNarrow = this.isNarrow();
    this.container.style.position = 'relative';
    this.buildDOM();
    this.bindTouch();
    this.bindResize();
  }

  private isNarrow(): boolean {
    return this.container.offsetWidth < MOBILE_BREAKPOINT;
  }

  private buildDOM(): void {
    this.container.innerHTML = '';

    this.viewport = document.createElement('div');
    this.viewport.className = 'banner-viewport';
    if (this.isNarrow()) {
      this.viewport.classList.add('mobile');
    }

    this.track = document.createElement('div');
    this.track.className = 'banner-track';
    this.viewport.appendChild(this.track);

    // Gradient masks — desktop only
    this.maskLeft = document.createElement('div');
    this.maskLeft.className = 'banner-mask banner-mask-left';
    this.maskRight = document.createElement('div');
    this.maskRight.className = 'banner-mask banner-mask-right';

    this.dots = document.createElement('div');
    this.dots.className = 'banner-dots';

    this.container.appendChild(this.maskLeft);
    this.container.appendChild(this.viewport);
    this.container.appendChild(this.maskRight);
    this.container.appendChild(this.dots);

    this.updateMaskVisibility();
  }

  private updateMaskVisibility(): void {
    if (!this.maskLeft || !this.maskRight) return;
    const hide = this.isNarrow();
    this.maskLeft.style.display = hide ? 'none' : '';
    this.maskRight.style.display = hide ? 'none' : '';
  }

  setItems(items: BannerItem[]): void {
    this.items = items;
    this.current = 0;
    this.loaded = false;
    this.renderSlides();
  }

  private imgHeight(): number {
    // Mobile: image height = viewport width / ratio, capped reasonably
    // We compute per-image in onload
    return this.isNarrow() ? 0 : BANNER_IMG_HEIGHT;
  }

  private renderSlides(): void {
    if (!this.track) return;
    this.track.innerHTML = '';
    // Remove old spacers
    this.track.style.paddingLeft = '';

    const narrow = this.isNarrow();
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

      img.onload = () => {
        const ratio = img.naturalWidth / img.naturalHeight;

        if (narrow) {
          // Mobile: image fills viewport width, height proportional
          const vw = this.viewport!.offsetWidth;
          img.style.width = `${vw}px`;
          img.style.height = `${Math.round(vw / ratio)}px`;
        } else {
          // Desktop: fixed height, width from ratio
          img.style.height = `${BANNER_IMG_HEIGHT}px`;
          img.style.width = `${Math.round(BANNER_IMG_HEIGHT * ratio)}px`;
        }

        loadedCount++;
        if (loadedCount === this.items.length && !this.loaded) {
          this.loaded = true;
          // Wait one frame for layout
          requestAnimationFrame(() => {
            if (narrow) {
              // No centering pads on mobile
            } else {
              this.addCenteringPads();
            }
            this.renderDots();
            this.updatePosition(false);
            this.startAuto();
          });
        }
      };

      img.onerror = () => {
        loadedCount++;
        if (loadedCount === this.items.length && !this.loaded) {
          this.loaded = true;
          requestAnimationFrame(() => {
            this.renderDots();
            this.updatePosition(false);
            this.startAuto();
          });
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
    const slides = this.track.querySelectorAll('.banner-slide') as NodeListOf<HTMLElement>;
    if (slides.length === 0 || !slides[this.current]) return;

    let scrollTarget = 0;
    for (let i = 0; i < this.current; i++) {
      scrollTarget += slides[i].offsetWidth;
    }

    this.viewport.style.scrollBehavior = animate ? 'smooth' : 'auto';
    this.viewport.scrollLeft = scrollTarget;

    // Update masks (desktop only)
    if (!this.isNarrow()) this.updateMasks();

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

    if (this.maskLeft) this.maskLeft.style.width = `${maskW}px`;
    if (this.maskRight) this.maskRight.style.width = `${maskW}px`;
  }

  private addCenteringPads(): void {
    if (!this.track || !this.viewport || this.isNarrow()) return;
    const slides = this.track.querySelectorAll('.banner-slide');
    if (slides.length === 0) return;

    const firstSlide = slides[0] as HTMLElement;
    const lastSlide = slides[slides.length - 1] as HTMLElement;

    const halfPad = Math.max(0, (this.viewport.offsetWidth - firstSlide.offsetWidth) / 2);
    this.track.style.paddingLeft = `${halfPad}px`;

    // Remove old spacer
    const old = this.track.querySelector('.banner-spacer');
    if (old) old.remove();

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

  private syncCurrentFromScroll(): void {
    if (!this.viewport || !this.track) return;
    const scrollLeft = this.viewport.scrollLeft;
    const vw = this.viewport.offsetWidth;
    const vpCenter = vw / 2;
    const padLeft = parseInt(getComputedStyle(this.track).paddingLeft) || 0;
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
      cumX += sw;
    }

    this.current = bestIdx;
  }

  private bindTouch(): void {
    if (!this.track || !this.viewport) return;

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

        const slides = this.track!.querySelectorAll('.banner-slide');
        let baseScroll = 0;
        for (let i = 0; i < this.current && i < slides.length; i++) {
          baseScroll += (slides[i] as HTMLElement).offsetWidth;
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

    // Trackpad / mousewheel scroll (desktop)
    let scrollTimer: number | null = null;
    this.viewport.addEventListener('scroll', () => {
      if (this.isDragging) return;
      this.stopAuto();
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        this.syncCurrentFromScroll();
        this.updatePosition(true);
        this.renderDots();
        this.startAuto();
      }, 2000);
    }, { passive: true });
  }

  // ---- Resize: re-render when crossing the 900px breakpoint ----
  private bindResize(): void {
    window.addEventListener('resize', () => {
      const nowNarrow = this.isNarrow();
      if (nowNarrow !== this.wasNarrow) {
        this.wasNarrow = nowNarrow;
        this.loaded = false;
        this.stopAuto();
        // Toggle mobile class on viewport
        if (this.viewport) {
          this.viewport.classList.toggle('mobile', nowNarrow);
        }
        if (this.items.length > 0) {
          this.renderSlides();
        }
        this.updateMaskVisibility();
      } else if (this.loaded) {
        // Same mode but viewport size changed — recalculate image sizes
        this.recalcImageSizes();
        if (!nowNarrow) {
          this.addCenteringPads();
        } else {
          this.track!.style.paddingLeft = '';
          const old = this.track!.querySelector('.banner-spacer');
          if (old) old.remove();
        }
        this.updatePosition(false);
      }
    });
  }

  private recalcImageSizes(): void {
    if (!this.viewport || !this.track) return;
    const narrow = this.isNarrow();
    const imgs = this.track.querySelectorAll('img');
    const vw = this.viewport.offsetWidth;

    imgs.forEach((img) => {
      if (narrow && img.naturalWidth > 0) {
        const ratio = img.naturalWidth / img.naturalHeight;
        img.style.width = `${vw}px`;
        img.style.height = `${Math.round(vw / ratio)}px`;
      } else if (!narrow) {
        img.style.height = `${BANNER_IMG_HEIGHT}px`;
        const ratio = img.naturalWidth / img.naturalHeight;
        img.style.width = `${Math.round(BANNER_IMG_HEIGHT * ratio)}px`;
      }
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
