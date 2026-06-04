// Hash-based SPA router — supports sub-routes & query params

type RouteHandler = () => void;

const routes: Map<string, RouteHandler> = new Map();

/** Strip query params and trailing slashes; handle sub-routes */
function matchRoute(hash: string): RouteHandler | null {
  // Exact match first
  if (routes.has(hash)) return routes.get(hash)!;

  // Try prefix match for sub-routes: "search?q=KAF" → "search", "playlist/123" → "playlist/"
  for (const [key, handler] of routes) {
    if (hash.startsWith(key) && (hash.length === key.length || hash[key.length] === '/' || hash[key.length] === '?')) {
      return handler;
    }
  }

  return null;
}

export const router = {
  register(hash: string, handler: RouteHandler): void {
    routes.set(hash, handler);
  },

  navigate(hash: string): void {
    location.hash = hash;
  },

  /** Raw hash without leading '#' */
  current(): string {
    return location.hash.slice(1) || 'home';
  },

  start(): void {
    const handle = () => {
      const page = this.current();
      const handler = matchRoute(page);
      if (handler) {
        handler();
      } else {
        const home = routes.get('home');
        if (home) home();
      }
    };

    window.addEventListener('hashchange', handle);
    handle();
  },
};
