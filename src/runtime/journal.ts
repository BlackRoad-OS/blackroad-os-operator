export interface JournalEntry {
  domain: string;
  message: string;
  timestamp: number;
  meta?: Record<string, unknown>;
}

export interface PsShaInfinity {
  record: (entry: JournalEntry) => void;
  recent: () => JournalEntry[];
}

export class DevPsShaInfinity implements PsShaInfinity {
  private entries: JournalEntry[] = [];

  record(entry: JournalEntry): void {
    this.entries.push(entry);
  }

  recent(): JournalEntry[] {
    return [...this.entries];
  }
}
