// Lightweight EventBus for loose coupling between components
class EventBus {
    constructor() {
        this.handlers = new Map();
    }
    on(event, handler) {
        if (!this.handlers.has(event)) {
            this.handlers.set(event, new Set());
        }
        this.handlers.get(event).add(handler);
    }
    off(event, handler) {
        this.handlers.get(event)?.delete(handler);
    }
    emit(event, ...args) {
        this.handlers.get(event)?.forEach((fn) => fn(...args));
    }
    // Clear all handlers on a given event
    clear(event) {
        this.handlers.delete(event);
    }
}
export const bus = new EventBus();
//# sourceMappingURL=event-bus.js.map