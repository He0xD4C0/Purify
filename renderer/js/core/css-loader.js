// CSS loader — loads CSS files on demand, idempotent (won't reload if already loaded)
const loaded = new Set();
/**
 * Load a CSS file by path. Safe to call multiple times.
 * @param path  Relative path from renderer root, e.g. 'css/account.css'
 */
export function loadCSS(path) {
    if (loaded.has(path))
        return;
    loaded.add(path);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = path;
    document.head.appendChild(link);
}
//# sourceMappingURL=css-loader.js.map