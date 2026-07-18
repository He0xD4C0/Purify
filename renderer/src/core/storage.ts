// localStorage wrapper with JSON serialization

const PREFIX = 'purify_';

export const storage = {
  get<T>(key: string, fallback?: T): T | null {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw === null) return fallback ?? null;
      return JSON.parse(raw) as T;
    } catch {
      return fallback ?? null;
    }
  },

  set(key: string, value: unknown): void {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      // quota exceeded — silently fail
    }
  },

  remove(key: string): void {
    localStorage.removeItem(PREFIX + key);
  },

  clear(): void {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  },
};
