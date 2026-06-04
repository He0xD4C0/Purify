// Simple hash-based SPA router
const routes = new Map();
export const router = {
    register(hash, handler) {
        routes.set(hash, handler);
    },
    navigate(hash) {
        location.hash = hash;
    },
    current() {
        return location.hash.slice(1) || 'home';
    },
    start() {
        const handle = () => {
            const page = this.current();
            const handler = routes.get(page);
            if (handler) {
                handler();
            }
            else {
                // fallback to home
                const home = routes.get('home');
                if (home)
                    home();
            }
        };
        window.addEventListener('hashchange', handle);
        handle();
    },
};
//# sourceMappingURL=router.js.map