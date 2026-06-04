// Simple hash-based SPA router

type RouteHandler = () => void;

const routes: Map<string, RouteHandler> = new Map();

export const router = {
  register(hash: string, handler: RouteHandler): void {
    routes.set(hash, handler);
  },

  navigate(hash: string): void {
    location.hash = hash;
  },

  current(): string {
    return location.hash.slice(1) || 'home';
  },

  start(): void {
    const handle = () => {
      const page = this.current();
      const handler = routes.get(page);
      if (handler) {
        handler();
      } else {
        // fallback to home
        const home = routes.get('home');
        if (home) home();
      }
    };

    window.addEventListener('hashchange', handle);
    handle();
  },
};
