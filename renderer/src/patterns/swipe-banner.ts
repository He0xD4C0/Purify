// Horizontal sliding banner carousel with touch swipe
// Desktop (>=900px): fixed image height 220px, centering, gradient masks
// Mobile (<900px): image fills viewport width, proportional height, no masks

interface BannerItem {
  imageUrl: string;
  url?: string;
  typeTitle?: string;
}

const IMG_H = 220;
const BP = 900;

export class SwipeBanner {
  private container: HTMLElement;
  private track: HTMLElement | null = null;
  private dots: HTMLElement | null = null;
  private viewport: HTMLElement | null = null;
  private maskL: HTMLElement | null = null;
  private maskR: HTMLElement | null = null;
  private items: BannerItem[] = [];
  private current = 0;
  private timer: number | null = null;
  private interval: number;
  private dragging = false;
  private dragBase = 0;
  private dragStartX = 0;
  private loaded = false;
  private narrow: boolean;
  private _touchSnapped = false;

  constructor(container: HTMLElement, interval = 4000) {
    this.container = container;
    this.interval = interval;
    this.narrow = this.isNarrow();
    this.container.style.position = 'relative';
    this.buildDOM();
    this.bindTouch();
    this.bindResize();
  }

  private isNarrow(): boolean { return this.container.offsetWidth < BP; }

  // ==================== DOM ====================

  private buildDOM(): void {
    this.container.innerHTML = '';
    this.viewport = document.createElement('div');
    this.viewport.className = 'banner-viewport';

    this.track = document.createElement('div');
    this.track.className = 'banner-track';
    this.viewport.appendChild(this.track);

    this.maskL = document.createElement('div');
    this.maskL.className = 'banner-mask banner-mask-left';
    this.maskR = document.createElement('div');
    this.maskR.className = 'banner-mask banner-mask-right';

    this.dots = document.createElement('div');
    this.dots.className = 'banner-dots';

    this.container.appendChild(this.maskL);
    this.container.appendChild(this.viewport);
    this.container.appendChild(this.maskR);
    this.container.appendChild(this.dots);

    this.syncMaskVis();
  }

  // ==================== Items ====================

  setItems(items: BannerItem[]): void {
    this.items = items;
    this.current = 0;
    this.loaded = false;
    this.stopAuto();
    this.buildSlides();
  }

  private buildSlides(): void {
    if (!this.track || !this.viewport) return;
    this.track.innerHTML = '';
    this.clearPads();

    const narrow = this.narrow;
    let done = 0;

    this.items.forEach((item, i) => {
      const slide = document.createElement('div');
      slide.className = 'banner-slide';
      slide.addEventListener('click', () => {
        if (!this.dragging && item.url) window.open(item.url, '_blank');
      });

      const img = document.createElement('img');
      img.src = item.imageUrl;
      img.alt = item.typeTitle || '';
      img.draggable = false;

      img.onload = () => {
        this.sizeImg(img, narrow);
        done++;
        if (done === this.items.length && !this.loaded) {
          this.loaded = true;
          requestAnimationFrame(() => this.onAllLoaded());
        }
      };

      img.onerror = () => {
        done++;
        if (done === this.items.length && !this.loaded) {
          this.loaded = true;
          requestAnimationFrame(() => this.onAllLoaded());
        }
      };

      slide.appendChild(img);
      this.track!.appendChild(slide);
    });
  }

  private sizeImg(img: HTMLImageElement, narrow: boolean): void {
    const ratio = img.naturalWidth / img.naturalHeight;
    if (narrow) {
      const vw = this.viewport!.offsetWidth;
      img.style.width = `${vw}px`;
      img.style.height = `${Math.round(vw / ratio)}px`;
    } else {
      img.style.height = `${IMG_H}px`;
      img.style.width = `${Math.round(IMG_H * ratio)}px`;
    }
  }

  private onAllLoaded(): void {
    this.setPads();
    this.renderDots();
    this.goTo(this.current);
    this.startAuto();
  }

  // ==================== Centering pads ====================

  /** Ensure first & last slide can be centered. Recalculates every call. */
  private setPads(): void {
    if (!this.track || !this.viewport || this.narrow) return;
    const slides = this.track.querySelectorAll('.banner-slide');
    if (slides.length === 0) return;
    const vw = this.viewport.offsetWidth;
    const firstW = (slides[0] as HTMLElement).offsetWidth;
    const lastW = (slides[slides.length - 1] as HTMLElement).offsetWidth;

    this.track.style.paddingLeft = `${Math.max(0, (vw - firstW) / 2)}px`;

    // trailing spacer
    this.clearPads();
    const spacer = document.createElement('div');
    spacer.className = 'banner-spacer';
    spacer.style.cssText = `flex-shrink:0; width:${Math.max(0, (vw - lastW) / 2)}px; height:1px;`;
    this.track.appendChild(spacer);
  }

  private clearPads(): void {
    if (!this.track) return;
    this.track.querySelectorAll('.banner-spacer').forEach((s) => s.remove());
  }

  // ==================== Navigation ====================

  goTo(index: number): void {
    this.current = index;
    this.scrollToCurrent(true);
    this.resetAuto();
  }

  next(): void {
    this.snapCurrent();
    this.goTo((this.current + 1) % this.items.length);
  }

  prev(): void {
    this.snapCurrent();
    this.goTo((this.current - 1 + this.items.length) % this.items.length);
  }

  /** Scroll so the current slide is centered in the viewport */
  private scrollToCurrent(animate: boolean): void {
    if (!this.viewport || !this.track) return;
    const slides = this.track.querySelectorAll('.banner-slide');
    const slide = slides[this.current] as HTMLElement | undefined;
    if (!slide) return;

    // Center: slide's midpoint should align with viewport midpoint
    const slideMid = slide.offsetLeft + slide.offsetWidth / 2;
    const vpMid = this.viewport.offsetWidth / 2;
    this.viewport.style.scrollBehavior = animate ? 'smooth' : 'auto';
    this.viewport.scrollLeft = slideMid - vpMid;

    if (!this.narrow) this.updateMasks();
    this.updateDots();
  }

  private snapCurrent(): void {
    if (!this.viewport || !this.track) return;
    const scrollLeft = this.viewport.scrollLeft;
    const vw = this.viewport.offsetWidth;
    const padLeft = parseInt(getComputedStyle(this.track).paddingLeft) || 0;
    const slides = this.track.querySelectorAll('.banner-slide');
    if (slides.length === 0) return;

    let best = 0, bestDist = Infinity, cumX = padLeft - scrollLeft;
    for (let i = 0; i < slides.length; i++) {
      const w = (slides[i] as HTMLElement).offsetWidth;
      const d = Math.abs(cumX + w / 2 - vw / 2);
      if (d < bestDist) { bestDist = d; best = i; }
      cumX += w;
    }
    this.current = best;
  }

  // ==================== Masks (desktop) ====================

  private updateMasks(): void {
    if (!this.viewport || !this.track) return;
    const slides = this.track.querySelectorAll('.banner-slide');
    const slide = slides[this.current] as HTMLElement | undefined;
    if (!slide) return;
    const maskW = Math.max(0, (this.viewport.offsetWidth - slide.offsetWidth) / 2);
    if (this.maskL) this.maskL.style.width = `${maskW}px`;
    if (this.maskR) this.maskR.style.width = `${maskW}px`;
  }

  private syncMaskVis(): void {
    const hide = this.narrow;
    if (this.maskL) this.maskL.style.display = hide ? 'none' : '';
    if (this.maskR) this.maskR.style.display = hide ? 'none' : '';
  }

  // ==================== Dots ====================

  private renderDots(): void {
    if (!this.dots) return;
    this.dots.innerHTML = '';
    this.items.forEach((_, i) => {
      const d = document.createElement('button');
      d.className = 'banner-dot' + (i === this.current ? ' active' : '');
      d.addEventListener('click', (e) => { e.stopPropagation(); this.goTo(i); });
      this.dots!.appendChild(d);
    });
  }

  private updateDots(): void {
    if (!this.dots) return;
    const all = this.dots.querySelectorAll('.banner-dot');
    all.forEach((d, i) => d.classList.toggle('active', i === this.current));
  }

  // ==================== Touch / Scroll ====================

  private bindTouch(): void {
    if (!this.track || !this.viewport) return;

    this.track.addEventListener('touchstart', (e: TouchEvent) => {
      this.dragStartX = e.touches[0].clientX;
      this.dragging = false;
      this.dragBase = this.viewport!.scrollLeft;
      this.stopAuto();
    }, { passive: true });

    this.track.addEventListener('touchmove', (e: TouchEvent) => {
      const dx = e.touches[0].clientX - this.dragStartX;
      if (Math.abs(dx) > 10) {
        this.dragging = true;
        e.preventDefault();
        this.viewport!.style.scrollBehavior = 'auto';
        this.viewport!.scrollLeft = this.dragBase - dx;
        // Real-time dot tracking during drag
        this.snapCurrent();
        this.updateDots();
      }
    }, { passive: false });

    this.track.addEventListener('touchend', () => {
      if (this.dragging) {
        this.snapCurrent();
        this.scrollToCurrent(true);
        this.dragging = false;
        // On mobile, suppress scroll-timer snap since we already snapped
        this._touchSnapped = true;
      }
      this.startAuto();
    });

    // Trackpad / mousewheel scroll
    // Update dots in real-time; snap after idle delay (desktop: 2s, mobile: instant)
    let scrollTimer: number | null = null;
    this.viewport.addEventListener('scroll', () => {
      if (this.dragging) return;
      if (this._touchSnapped) { this._touchSnapped = false; return; }

      // Real-time dot tracking
      this.snapCurrent();
      this.updateDots();

      this.stopAuto();
      if (scrollTimer) clearTimeout(scrollTimer);
      const delay = this.narrow ? 150 : 2000;
      scrollTimer = window.setTimeout(() => {
        this.scrollToCurrent(true);
        this.startAuto();
      }, delay);
    }, { passive: true });
  }

  // ==================== Resize ====================

  private bindResize(): void {
    window.addEventListener('resize', () => {
      const was = this.narrow;
      this.narrow = this.isNarrow();

      if (this.narrow !== was) {
        // Crossed breakpoint — rebuild
        this.stopAuto();
        this.syncMaskVis();
        if (this.items.length > 0) {
          this.loaded = false;
          this.buildSlides();
        }
      } else if (this.loaded && this.items.length > 0) {
        // Same mode, different size — recalc
        this.recalcAllImgSizes();
        this.setPads();
        // Re-center current slide
        requestAnimationFrame(() => this.scrollToCurrent(false));
      }
    });
  }

  private recalcAllImgSizes(): void {
    if (!this.track) return;
    this.track.querySelectorAll('img').forEach((img) => this.sizeImg(img, this.narrow));
  }

  // ==================== Timer ====================

  startAuto(): void {
    if (this.timer) return;
    this.timer = window.setInterval(() => this.next(), this.interval);
  }

  stopAuto(): void {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  resetAuto(): void { this.stopAuto(); this.startAuto(); }

  destroy(): void { this.stopAuto(); }
}
