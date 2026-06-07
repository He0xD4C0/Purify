// Interactive album/playlist cover with hover preview and click navigation

export function createInteractiveCover(
  picUrl: string,
  size: number,
  onClick: () => void,
  playable = false
): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'interactive-cover';
  wrapper.style.position = 'relative';
  wrapper.style.width = `${size}px`;
  wrapper.style.height = `${size}px`;
  wrapper.style.cursor = 'pointer';

  const img = document.createElement('img');
  img.src = `${picUrl}?param=${size}y${size}`;
  img.alt = '';
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.borderRadius = 'var(--radius)';
  img.style.objectFit = 'cover';
  img.loading = 'lazy';

  if (playable) {
    const overlay = document.createElement('div');
    overlay.className = 'cover-play-overlay';
    overlay.innerHTML = '▶';
    overlay.style.cssText = `
      position: absolute; inset: 0;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.4); opacity: 0;
      transition: opacity 0.2s; font-size: 28px;
      border-radius: var(--radius);
    `;
    wrapper.appendChild(overlay);
    wrapper.addEventListener('mouseenter', () => (overlay.style.opacity = '1'));
    wrapper.addEventListener('mouseleave', () => (overlay.style.opacity = '0'));
  }

  wrapper.appendChild(img);
  wrapper.addEventListener('click', onClick);
  return wrapper;
}
