// Global cover component — 1:1 square image with consistent styling
// Usage: createCover(picUrl, width) → HTMLElement
/**
 * Create a 1:1 square cover image.
 * @param picUrl  Image source (CDN URL, ?param will be appended)
 * @param width   Desired width in px (height = width, 1:1)
 * @param opts    Optional: alt text, extra class, click handler
 */
export function createCover(picUrl, width, opts) {
    const wrapper = document.createElement('div');
    wrapper.className = `cover${opts?.className ? ` ${opts.className}` : ''}`;
    wrapper.style.width = `${width}px`;
    wrapper.style.height = `${width}px`;
    const img = document.createElement('img');
    img.src = picUrl ? `${picUrl}?param=${width * 2}y${width * 2}` : '';
    img.alt = opts?.alt || '';
    img.loading = 'lazy';
    img.onerror = () => {
        wrapper.classList.add('cover--error');
    };
    wrapper.appendChild(img);
    if (opts?.onClick) {
        wrapper.style.cursor = 'pointer';
        wrapper.addEventListener('click', opts.onClick);
    }
    return wrapper;
}
//# sourceMappingURL=cover.js.map