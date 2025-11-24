import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Prism Console',
  description: 'Monitor BlackRoad OS environments from a single pane of glass.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground">
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#11182b,transparent_40%),radial-gradient(circle_at_bottom_right,#0c1426,transparent_45%)]">
          <header className="border-b border-border/50 px-6 py-4">
            <div className="mx-auto flex max-w-5xl items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-accent">BlackRoad OS</p>
                <h1 className="text-xl font-semibold">Prism Console</h1>
              </div>
              <span className="rounded-full border border-border/60 bg-muted px-3 py-1 text-xs text-foreground/70">
                Gen-0 Preview
              </span>
            </div>
          </header>
          <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
