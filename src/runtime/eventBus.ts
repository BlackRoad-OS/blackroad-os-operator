import { Logger } from '../utils/logger';

export interface Event<TPayload = unknown> {
  type: string;
  domain?: string;
  payload?: TPayload;
  timestamp: number;
}

export interface EventSubscription {
  unsubscribe: () => void;
}

export interface EventBus {
  publish: (event: Event) => void;
  subscribe: (type: string, handler: (event: Event) => void) => EventSubscription;
  getRecentEvents: () => Event[];
}

export class LocalEventBus implements EventBus {
  private listeners: Map<string, Set<(event: Event) => void>> = new Map();
  private recentEvents: Event[] = [];
  constructor(private logger?: Logger) {}

  publish(event: Event): void {
    this.recentEvents = [...this.recentEvents.slice(-99), event];
    const handlers = [
      ...(this.listeners.get(event.type) ?? []),
      ...(this.listeners.get('*') ?? []),
    ];
    handlers.forEach((handler) => {
      try {
        handler(event);
      } catch (err) {
        this.logger?.error?.('Event handler error', err);
      }
    });
  }

  subscribe(type: string, handler: (event: Event) => void): EventSubscription {
    const handlers = this.listeners.get(type) ?? new Set();
    handlers.add(handler);
    this.listeners.set(type, handlers);
    return {
      unsubscribe: () => handlers.delete(handler),
    };
  }

  getRecentEvents(): Event[] {
    return [...this.recentEvents];
  }
}
