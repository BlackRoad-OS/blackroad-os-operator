/**
 * BlackRoad OS - Prism Console Agents View
 * Lists active agents, packs, and operational status
 *
 * @blackroad_name Agents
 * @operator alexa.operator.v1
 */

const agents = [
  {
    name: 'Cece',
    type: 'lucidia',
    status: 'ready' as const,
    uptime: '99.99%',
    invocations: '1,247',
    lastAction: 'policy:validate',
  },
  {
    name: 'Beacon Router',
    type: 'beacon',
    status: 'busy' as const,
    uptime: '99.9%',
    invocations: '892',
    lastAction: 'mesh:route',
  },
  {
    name: 'Research Lab',
    type: 'pack',
    status: 'ready' as const,
    uptime: '99.5%',
    invocations: '456',
    lastAction: 'agents:invoke',
  },
  {
    name: 'Finance Pack',
    type: 'pack',
    status: 'ready' as const,
    uptime: '99.8%',
    invocations: '234',
    lastAction: 'ledger:settle',
  },
  {
    name: 'Legal Assistant',
    type: 'custom',
    status: 'paused' as const,
    uptime: '98.4%',
    invocations: '123',
    lastAction: 'policy:draft',
  },
  {
    name: 'DevOps Agent',
    type: 'custom',
    status: 'ready' as const,
    uptime: '99.9%',
    invocations: '567',
    lastAction: 'operator:deploy',
  },
];

const badges: Record<typeof agents[number]['status'], string> = {
  ready: 'badge-success',
  busy: 'badge-info',
  paused: 'badge-warning',
};

export default function AgentsPage() {
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white">Agents</h1>
        <p className="text-gray-400">Operational status across Lucidia, Beacon, and Pack agents.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard title="Active" value="24" change="+3" />
        <SummaryCard title="Average SLA" value="99.9%" change="+0.1%" />
        <SummaryCard title="Current Invocations" value="1,856" change="+8%" />
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Agent Roster</h2>
            <p className="text-sm text-gray-500">Real-time posture pulled from Prism mesh.</p>
          </div>
          <div className="flex gap-2">
            <span className="badge badge-success">ready</span>
            <span className="badge badge-info">busy</span>
            <span className="badge badge-warning">paused</span>
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Status</th>
              <th>Uptime</th>
              <th>Invocations</th>
              <th>Last Action</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => (
              <tr key={agent.name}>
                <td className="font-medium text-white">{agent.name}</td>
                <td className="text-gray-400">{agent.type}</td>
                <td>
                  <span className={`badge ${badges[agent.status]}`}>{agent.status}</span>
                </td>
                <td className="text-gray-400">{agent.uptime}</td>
                <td className="text-gray-400">{agent.invocations}</td>
                <td className="text-gray-400">{agent.lastAction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  change,
}: {
  title: string;
  value: string;
  change: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-label">{title}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-change stat-change-up">↗ {change}</div>
    </div>
  );
}
