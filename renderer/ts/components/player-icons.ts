// SVG icons for player bar — no dependencies, safe from circular imports

export const SVG = {
  note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7.5 4.5c-.3-.2-.7-.2-1-.1-.3.1-.5.4-.5.8v13.6c0 .4.2.7.5.8.3.1.7.1 1-.1l11.5-6.8c.3-.2.5-.5.5-.8s-.2-.6-.5-.8L7.5 4.5z" stroke-linejoin="round"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="4" width="5" height="16" rx="1.5"/><rect x="14" y="4" width="5" height="16" rx="1.5"/></svg>',
  prev: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 5v14L9 12z"/><path d="M9 5v14H6V5z"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5v14l9-7z"/><path d="M15 5v14h3V5z"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 00-7.8 7.8L12 21l8.9-8.9a5.5 5.5 0 000-7.8z"/></svg>',
  list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>',
  random: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>',
  single: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/><text x="8" y="16" font-size="8" fill="currentColor" stroke="none" font-weight="bold">1</text></svg>',
};

export const MODE_ICONS: Record<string, string> = { list: SVG.list, random: SVG.random, single: SVG.single };
