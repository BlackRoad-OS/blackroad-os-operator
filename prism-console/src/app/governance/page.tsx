/**
 * BlackRoad OS - Governance Console
 * Policy compliance posture and decision logs
 *
 * @blackroad_name Governance
 * @operator alexa.operator.v1
 */

const controls = [
  {
    name: 'Zero-Knowledge Access',
    coverage: 'Enabled for all user auth',
    status: 'healthy' as const,
  },
  {
    name: 'Ledger Replication',
    coverage: 'Archive + primary regions',
    status: 'healthy' as const,
  },
  {
    name: 'AI Safety Harness',
    coverage: 'All Lucidia and Pack agents',
    status: 'attention' as const,
  },
  {
    name: 'Supply Chain Attestation',
    coverage: 'Operator + Gateway builds',
    status: 'healthy' as const,
  },
];

const decisions = [
  {
    action: 'agents:invoke',
    entity: 'agent-cece',
    policy: 'Explainability Doctrine',
    outcome: 'allow' as const,
    time: '2 min ago',
  },
  {
    action: 'operator:deploy',
    entity: 'service-api',
    policy: 'Side Channel Budget',
    outcome: 'allow' as const,
    time: '5 min ago',
  },
  {
    action: 'mesh:connect',
    entity: 'node-pi-42',
    policy: 'Resilience Code',
    outcome: 'escalate' as const,
    time: '8 min ago',
  },
  {
    action: 'data:access',
    entity: 'user-123',
    policy: 'Identity Guard',
    outcome: 'deny' as const,
    time: '12 min ago',
  },
];

const outcomeBadge: Record<typeof decisions[number]['outcome'], string> = {
  allow: 'badge-success',
  deny: 'badge-error',
  escalate: 'badge-warning',
};

export default function GovernancePage() {
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white">Governance</h1>
        <p className="text-gray-400">Codex-aligned policies, safety controls, and recent decisions.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard title="Policy Coverage" value="98%" description="Controls mapped to services" />
        <SummaryCard title="Open Incidents" value="2" description="Both under review" />
        <SummaryCard title="Evaluations (24h)" value="1.2M" description="Policy engine throughput" />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Safety Controls</h2>
              <p className="text-sm text-gray-500">Enforced in Prism runtime.</p>
            </div>
          </div>
          <div className="space-y-4">
            {controls.map((control) => (
              <div key={control.name} className="rounded-lg border border-gray-800/70 bg-gray-900/40 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">{control.name}</p>
                    <p className="text-sm text-gray-500">{control.coverage}</p>
                  </div>
                  <span
                    className={`badge ${control.status === 'healthy' ? 'badge-success' : 'badge-warning'}`}
                  >
                    {control.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Decisions</h2>
            <span className="text-xs text-gray-500">Synced from Prism ledger</span>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Entity</th>
                <th>Policy</th>
                <th>Outcome</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {decisions.map((decision) => (
                <tr key={`${decision.action}-${decision.time}`}>
                  <td>{decision.action}</td>
                  <td className="text-gray-400">{decision.entity}</td>
                  <td className="text-gray-400">{decision.policy}</td>
                  <td>
                    <span className={`badge ${outcomeBadge[decision.outcome]}`}>{decision.outcome}</span>
                  </td>
                  <td className="text-gray-400">{decision.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-label">{title}</div>
      <div className="stat-value">{value}</div>
      <div className="text-xs text-gray-500">{description}</div>
    </div>
  );
}
