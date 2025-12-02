/**
 * BlackRoad OS - Prism Console Layout
 * Admin dashboard root layout
 *
 * @blackroad_name Prism Console
 * @operator alexa.operator.v1
 */

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Prism Console | BlackRoad OS',
  description: 'Admin dashboard for BlackRoad OS governance platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-gray-950 text-gray-100 antialiased">
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="w-64 border-r border-gray-800 bg-gray-900/50 p-4">
            <div className="mb-8">
              <h1 className="text-xl font-bold text-white">Prism Console</h1>
              <p className="text-sm text-gray-500">BlackRoad OS Admin</p>
            </div>

            <nav className="space-y-1">
              <NavItem href="/" icon="home">Dashboard</NavItem>
              <NavItem href="/agents" icon="bot">Agents</NavItem>
              <NavItem href="/governance" icon="shield">Governance</NavItem>
              <NavItem href="/ledger" icon="scroll">Ledger</NavItem>
              <NavItem href="/collaboration" icon="users">Collaboration</NavItem>
              <NavItem href="/intents" icon="route">Intents</NavItem>
              <NavItem href="/settings" icon="settings">Settings</NavItem>
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

function NavItem({
  href,
  icon,
  children,
}: {
  href: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
    >
      <span className="text-lg">{getIcon(icon)}</span>
      <span>{children}</span>
    </a>
  );
}

function getIcon(name: string): string {
  const icons: Record<string, string> = {
    home: '🏠',
    bot: '🤖',
    shield: '🛡️',
    scroll: '📜',
    users: '👥',
    route: '🔀',
    settings: '⚙️',
  };
  return icons[name] || '•';
}
