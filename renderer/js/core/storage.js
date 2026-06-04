// localStorage wrapper with JSON serialization
const PREFIX = 'purify_';
export const storage = {
    get(key, fallback) {
        try {
            const raw = localStorage.getItem(PREFIX + key);
            if (raw === null)
                return fallback ?? null;
            return JSON.parse(raw);
        }
        catch {
            return fallback ?? null;
        }
    },
    set(key, value) {
        try {
            localStorage.setItem(PREFIX + key, JSON.stringify(value));
        }
        catch {
            // quota exceeded — silently fail
        }
    },
    remove(key) {
        localStorage.removeItem(PREFIX + key);
    },
    clear() {
        Object.keys(localStorage)
            .filter((k) => k.startsWith(PREFIX))
            .forEach((k) => localStorage.removeItem(k));
    },
};
//# sourceMappingURL=storage.js.map