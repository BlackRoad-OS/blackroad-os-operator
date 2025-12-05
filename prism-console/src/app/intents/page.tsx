/**
 * BlackRoad OS - Intent Router
 * View queued intents and routing paths from Prism
 *
 * @blackroad_name Intents
 * @operator alexa.operator.v1
 */

const intents = [
  {
    id: 'intent-982',
    description: 'File IP claim for user-123',
    route: 'legal → lucidia → ledger',
    status: 'queued' as const,
    priority: 'high',
  },
  {
    id: 'intent-983',
    description: 'Deploy updated gateway config',
    route: 'devops → operator',
    status: 'in-flight' as const,
    priority: 'medium',
  },
  {
    id: 'intent-984',
    description: 'Research competitor filings',
    route: 'research-lab → archive',
    status: 'in-flight' as const,
    priority: 'low',
  },
];

const statusBadge: Record<typeof intents[number]['status'], string> = {
  queued: 'badge-warning',
  'in-flight': 'badge-info',
};

export default function IntentsPage() {
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white">Intents</h1>
        <p className="text-gray-400">Queued and executing intents routed through Prism.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Queued" value="12" trend="+2" />
        <StatCard label="In Flight" value="8" trend="+1" />
        <StatCard label="Completed (24h)" value="214" trend="+12%" />
      </section>

      <section className="card">
        <div className="card-header">
          <h2 className="card-title">Active Intents</h2>
          <span className="text-xs text-gray-500">Prism router</span>
        </div>

        <div className="space-y-4">
          {intents.map((intent) => (
            <div key={intent.id} className="rounded-lg border border-gray-800/70 bg-gray-900/40 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">{intent.description}</p>
                  <p className="text-sm text-gray-500">{intent.route}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${statusBadge[intent.status]}`}>{intent.status}</span>
                  <span className="badge badge-success">{intent.priority} priority</span>
                </div>
              </div>
              <p className="mt-2 font-mono text-xs text-gray-500">{intent.id}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-change stat-change-up">↗ {trend}</div>
    </div>
  );
}
