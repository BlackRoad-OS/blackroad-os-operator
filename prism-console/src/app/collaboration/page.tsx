/**
 * BlackRoad OS - Collaboration Hub
 * Surfaces workrooms and synced operator notes from Prism
 *
 * @blackroad_name Collaboration
 * @operator alexa.operator.v1
 */

const rooms = [
  {
    name: 'Apollo Launch',
    members: 12,
    status: 'active' as const,
    summary: 'Coordinating launch readiness, approvals, and safety checks.',
  },
  {
    name: 'IP Claims',
    members: 6,
    status: 'focus' as const,
    summary: 'Legal + Lucidia research on filings and counter-claims.',
  },
  {
    name: 'Incident Review',
    members: 4,
    status: 'active' as const,
    summary: 'Post-incident analysis with ledger pulls and codex mapping.',
  },
];

const statusBadge: Record<typeof rooms[number]['status'], string> = {
  active: 'badge-success',
  focus: 'badge-warning',
};

export default function CollaborationPage() {
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white">Collaboration</h1>
        <p className="text-gray-400">Prism-synced workrooms and operator handoffs.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard title="Rooms" value="9" caption="Active" />
        <StatCard title="Participants" value="34" caption="Across ops + legal" />
        <StatCard title="Handoffs (24h)" value="57" caption="Prism → Operator" />
      </section>

      <section className="card">
        <div className="card-header">
          <h2 className="card-title">Active Rooms</h2>
          <span className="text-xs text-gray-500">Synced every 30s</span>
        </div>

        <div className="space-y-4">
          {rooms.map((room) => (
            <div key={room.name} className="rounded-lg border border-gray-800/70 bg-gray-900/40 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">{room.name}</p>
                  <p className="text-sm text-gray-500">{room.summary}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span className={`badge ${statusBadge[room.status]}`}>{room.status}</span>
                  <span className="badge badge-info">{room.members} members</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  caption,
}: {
  title: string;
  value: string;
  caption: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-label">{title}</div>
      <div className="stat-value">{value}</div>
      <div className="text-xs text-gray-500">{caption}</div>
    </div>
  );
}
