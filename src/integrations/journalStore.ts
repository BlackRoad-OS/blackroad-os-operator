import { DomainEvent, JournalEntry, PsShaInfinity } from "blackroad-os-core";

export interface JournalStore {
  append(entry: JournalEntry): Promise<void>;
  getRecent(limit: number): Promise<JournalEntry[]>;
}

export class InMemoryJournalStore implements JournalStore {
  private entries: JournalEntry[] = [];

  async append(entry: JournalEntry): Promise<void> {
    this.entries.push(entry);
  }

  async getRecent(limit: number): Promise<JournalEntry[]> {
    return this.entries.slice(-limit);
  }
}

export function eventToJournalEntry(event: DomainEvent): JournalEntry {
  const now = new Date().toISOString();
  const id: PsShaInfinity = `${event.id}:journal:${now}`;

  return {
    id,
    eventId: event.id,
    createdAt: now,
    data: event,
  };
}
