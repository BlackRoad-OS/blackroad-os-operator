/**
 * BlackRoad OS - Ledger View
 * Event stream surfaced from Prism console
 *
 * @blackroad_name Ledger
 * @operator alexa.operator.v1
 */

const events = [
  {
    id: 'evt_abc123',
    action: 'agents:invoke',
    entity: 'agent-cece',
    decision: 'allow' as const,
    time: '2 min ago',
  },
  {
    id: 'evt_def456',
    action: 'mesh:connect',
    entity: 'node-pi-42',
    decision: 'allow' as const,
    time: '5 min ago',
  },
  {
    id: 'evt_ghi789',
    action: 'operator:deploy',
    entity: 'service-api',
    decision: 'allow' as const,
    time: '12 min ago',
  },
  {
    id: 'evt_jkl012',
    action: 'agents:invoke',
    entity: 'agent-beacon',
    decision: 'deny' as const,
    time: '15 min ago',
  },
  {
    id: 'evt_mno345',
    action: 'data:access',
    entity: 'user-123',
    decision: 'allow' as const,
    time: '20 min ago',
  },
];

const decisionBadge: Record<typeof events[number]['decision'], string> = {
  allow: 'badge-success',
  deny: 'badge-error',
};

export default function LedgerPage() {
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white">Ledger</h1>
        <p className="text-gray-400">Signed decisions streamed from Prism for auditing.</p>
      </header>

      <section className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Recent Ledger Events</h2>
            <p className="text-sm text-gray-500">Rolling 24h window</p>
          </div>
          <a href="/governance" className="text-sm text-[var(--br-orange)] hover:underline">
            View policy mapping
          </a>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Event ID</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Decision</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id}>
                <td className="font-mono text-xs text-gray-400">{event.id}</td>
                <td>{event.action}</td>
                <td className="text-gray-400">{event.entity}</td>
                <td>
                  <span className={`badge ${decisionBadge[event.decision]}`}>{event.decision}</span>
                </td>
                <td className="text-gray-400">{event.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
