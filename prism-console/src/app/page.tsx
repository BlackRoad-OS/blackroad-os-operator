/**
 * BlackRoad OS - Prism Console Dashboard
 * Main admin dashboard page
 *
 * @blackroad_name Dashboard
 * @operator alexa.operator.v1
 */

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400">BlackRoad OS Governance Overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Agents"
          value="24"
          change="+3"
          changeType="up"
        />
        <StatCard
          label="Policy Evaluations"
          value="1.2M"
          change="+12%"
          changeType="up"
        />
        <StatCard
          label="Ledger Events"
          value="847K"
          change="+5%"
          changeType="up"
        />
        <StatCard
          label="Active Sessions"
          value="156"
          change="-2"
          changeType="down"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Policy Decisions Chart */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Policy Decisions (24h)</h2>
          </div>
          <div className="h-64 flex items-center justify-center text-gray-500">
            Chart placeholder - Install recharts
          </div>
        </div>

        {/* Agent Activity Chart */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Agent Activity (24h)</h2>
          </div>
          <div className="h-64 flex items-center justify-center text-gray-500">
            Chart placeholder - Install recharts
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Ledger Events</h2>
          <a href="/ledger" className="text-sm text-[var(--br-orange)] hover:underline">
            View all
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
            <EventRow
              id="evt_abc123"
              action="agents:invoke"
              entity="agent-cece"
              decision="allow"
              time="2 min ago"
            />
            <EventRow
              id="evt_def456"
              action="mesh:connect"
              entity="node-pi-42"
              decision="allow"
              time="5 min ago"
            />
            <EventRow
              id="evt_ghi789"
              action="operator:deploy"
              entity="service-api"
              decision="allow"
              time="12 min ago"
            />
            <EventRow
              id="evt_jkl012"
              action="agents:invoke"
              entity="agent-beacon"
              decision="deny"
              time="15 min ago"
            />
            <EventRow
              id="evt_mno345"
              action="data:access"
              entity="user-123"
              decision="allow"
              time="20 min ago"
            />
          </tbody>
        </table>
      </div>

      {/* Active Agents */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Active Agents</h2>
          <a href="/agents" className="text-sm text-[var(--br-orange)] hover:underline">
            Manage
          </a>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AgentCard
            name="Cece"
            type="lucidia"
            status="ready"
            invocations={1247}
          />
          <AgentCard
            name="Beacon Router"
            type="beacon"
            status="busy"
            invocations={892}
          />
          <AgentCard
            name="Research Lab"
            type="pack"
            status="ready"
            invocations={456}
          />
          <AgentCard
            name="Finance Pack"
            type="pack"
            status="ready"
            invocations={234}
          />
          <AgentCard
            name="Legal Assistant"
            type="custom"
            status="paused"
            invocations={123}
          />
          <AgentCard
            name="DevOps Agent"
            type="custom"
            status="ready"
            invocations={567}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  change,
  changeType,
}: {
  label: string;
  value: string;
  change: string;
  changeType: 'up' | 'down';
}) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className={`stat-change ${changeType === 'up' ? 'stat-change-up' : 'stat-change-down'}`}>
        {changeType === 'up' ? '↑' : '↓'} {change}
      </div>
    </div>
  );
}

function EventRow({
  id,
  action,
  entity,
  decision,
  time,
}: {
  id: string;
  action: string;
  entity: string;
  decision: 'allow' | 'deny' | 'escalate';
  time: string;
}) {
  const decisionStyles = {
    allow: 'badge-success',
    deny: 'badge-error',
    escalate: 'badge-warning',
  };

  return (
    <tr>
      <td className="font-mono text-xs text-gray-400">{id}</td>
      <td>{action}</td>
      <td>{entity}</td>
      <td>
        <span className={`badge ${decisionStyles[decision]}`}>
          {decision}
        </span>
      </td>
      <td className="text-gray-400">{time}</td>
    </tr>
  );
}

function AgentCard({
  name,
  type,
  status,
  invocations,
}: {
  name: string;
  type: string;
  status: 'ready' | 'busy' | 'paused' | 'error';
  invocations: number;
}) {
  const statusStyles = {
    ready: 'badge-success',
    busy: 'badge-info',
    paused: 'badge-warning',
    error: 'badge-error',
  };

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/30 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-white">{name}</h3>
        <span className={`badge ${statusStyles[status]}`}>{status}</span>
      </div>
      <div className="mt-2 text-sm text-gray-400">
        Type: {type}
      </div>
      <div className="mt-1 text-sm text-gray-500">
        {invocations.toLocaleString()} invocations today
      </div>
    </div>
  );
}
