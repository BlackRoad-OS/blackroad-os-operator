import { EnvCard } from '@/components/EnvCard';
import { StatusPill } from '@/components/StatusPill';
import { getEnvironments, getHealth } from '@/lib/fetcher';

export default async function HomePage() {
  const [envs, health] = await Promise.all([getEnvironments(), getHealth()]);

  return (
    <div className="space-y-6">
      <section className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/30 p-4">
        <div>
          <p className="text-sm text-foreground/70">Overall Health</p>
          <h2 className="text-xl font-semibold">Beacon Cluster</h2>
          <p className="text-xs text-foreground/60">Uptime: {Math.round(health.uptime)}s</p>
        </div>
        <StatusPill status={health.status === 'ok' ? 'healthy' : 'degraded'} />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-foreground/60">Environments</p>
            <h2 className="text-lg font-semibold">Active footprints</h2>
          </div>
          <span className="rounded-full border border-border/60 bg-muted px-3 py-1 text-xs text-foreground/70">
            TODO(prism-next): wire search & filters
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {envs.map((env) => (
            <EnvCard key={env.id} env={env} />
          ))}
        </div>
      </section>
    </div>
  );
}
