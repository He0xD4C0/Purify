// Lightweight EventBus for loose coupling between components

type Handler = (...args: any[]) => void;

class EventBus {
  private handlers: Map<string, Set<Handler>> = new Map();

  on(event: string, handler: Handler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  off(event: string, handler: Handler): void {
    this.handlers.get(event)?.delete(handler);
  }

  emit(event: string, ...args: unknown[]): void {
    this.handlers.get(event)?.forEach((fn) => fn(...args));
  }

  // Clear all handlers on a given event
  clear(event: string): void {
    this.handlers.delete(event);
  }
}

export const bus = new EventBus();
