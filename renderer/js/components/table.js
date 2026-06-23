// Generic Table — two-phase rendering for performance
//
// Phase 1: HTML string generation (fast, synchronous)
// Phase 2: Event binding (after DOM insertion)
//
// Usage:
//   const { el, bind } = createTable({ columns, data, ... });
//   container.appendChild(el);
//   bind(); // attach event listeners
/**
 * Create a table using innerHTML for fast initial render.
 * Returns the element + a bind() function for event listeners.
 */
export function createTable(options) {
    const { columns, data, className, onRowClick, rowClass, rowDataset } = options;
    const gridCols = columns.map((c) => c.width).join(' ');
    const tableClass = className ? `table ${className}` : 'table';
    // Phase 1: build HTML string
    let html = '';
    const afterRenderTasks = [];
    data.forEach((row, i) => {
        const cls = rowClass ? rowClass(row, i) : '';
        const rowClassStr = cls ? ` ${cls}` : '';
        // Dataset attributes
        let datasetStr = '';
        if (rowDataset) {
            const ds = rowDataset(row, i);
            for (const [k, v] of Object.entries(ds)) {
                datasetStr += ` data-${k}="${escapeAttr(v)}"`;
            }
        }
        html += `<div class="table-row${rowClassStr}"${datasetStr} style="grid-template-columns:${gridCols}">`;
        columns.forEach((col) => {
            const cellClass = col.className ? ` table-cell ${col.className}` : 'table-cell';
            html += `<div class="${cellClass}">${col.renderHTML(row, i)}</div>`;
        });
        html += '</div>';
    });
    const el = document.createElement('div');
    el.className = tableClass;
    el.innerHTML = html;
    // Phase 2: bind events after DOM insertion
    const bind = () => {
        const rows = el.children;
        for (let i = 0; i < rows.length; i++) {
            const rowEl = rows[i];
            const row = data[i];
            const cells = rowEl.children;
            // Column afterRender hooks
            columns.forEach((col, ci) => {
                if (col.afterRender) {
                    col.afterRender(cells[ci], row, i);
                }
            });
            // Row click
            if (onRowClick) {
                rowEl.addEventListener('click', (e) => onRowClick(row, i, e));
            }
        }
    };
    return { el, bind };
}
function escapeAttr(s) {
    return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
//# sourceMappingURL=table.js.map