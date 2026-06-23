// Placeholder — reserves space before content is ready
//
// Usage:
//   const ph = createPlaceholder({ height: 400, rows: 10 });
//   container.appendChild(ph.el);
//   // ... later, when data arrives:
//   ph.replace(actualTableElement);
export function createPlaceholder(options = {}) {
    const { rows = 5, rowHeight = 44, className = '', } = options;
    const height = typeof options.height === 'number'
        ? options.height
        : typeof options.height === 'string'
            ? options.height
            : rows * rowHeight;
    const el = document.createElement('div');
    el.className = `placeholder${className ? ` ${className}` : ''}`;
    el.style.height = typeof height === 'number' ? `${height}px` : height;
    // Skeleton rows
    const gap = 8;
    for (let i = 0; i < rows; i++) {
        const row = document.createElement('div');
        row.className = 'placeholder-row';
        row.style.top = `${i * (rowHeight + gap)}px`;
        row.style.height = `${rowHeight}px`;
        el.appendChild(row);
    }
    const replace = (content) => {
        if (!el.parentElement)
            return;
        el.parentElement.replaceChild(content, el);
    };
    return { el, replace };
}
//# sourceMappingURL=placeholder.js.map