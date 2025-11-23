import { DomainEvent } from "blackroad-os-core";
import { Logger } from "../utils/logger";

export class EventBus {
  private subscribers: ((event: DomainEvent) => void)[] = [];
  private recentEvents: DomainEvent[] = [];

  constructor(private bufferSize: number, private logger?: Logger) {}

  emit(event: DomainEvent): void {
    this.logger?.debug("Emitting event", event.type, event.id);
    this.recentEvents.push(event);
    if (this.recentEvents.length > this.bufferSize) {
      this.recentEvents.shift();
    }

    for (const handler of this.subscribers) {
      try {
        handler(event);
      } catch (err) {
        this.logger?.error("Event handler failed", err);
      }
    }
  }

  subscribe(handler: (event: DomainEvent) => void): () => void {
    this.subscribers.push(handler);
    return () => {
      this.subscribers = this.subscribers.filter((h) => h !== handler);
    };
  }

  getRecentEvents(limit?: number): DomainEvent[] {
    if (limit && limit > 0) {
      return this.recentEvents.slice(-limit);
    }
    return [...this.recentEvents];
  }
}
