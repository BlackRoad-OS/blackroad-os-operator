/**
 * BlackRoad OS - Prism Settings
 * Environment + transport settings surfaced from Prism
 *
 * @blackroad_name Settings
 * @operator alexa.operator.v1
 */

const settings = [
  {
    name: 'Environment',
    value: 'production',
    detail: 'Railway primary + archive',
  },
  {
    name: 'Ledger Replication',
    value: 'enabled',
    detail: 'Archive + 2 regions',
  },
  {
    name: 'Event Bus',
    value: 'prism-console',
    detail: 'Kafka → EventBridge mirror',
  },
  {
    name: 'Access Control',
    value: 'codex + ledger',
    detail: 'Policy + signed attestations',
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400">Shared configuration mirrored from Prism runtime.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {settings.map((setting) => (
          <div key={setting.name} className="card">
            <div className="card-header">
              <h2 className="card-title">{setting.name}</h2>
              <span className="badge badge-success">{setting.value}</span>
            </div>
            <p className="text-sm text-gray-500">{setting.detail}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
