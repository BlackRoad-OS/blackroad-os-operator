import { notFound } from 'next/navigation';
import { StatusPill } from '@/components/StatusPill';
import { getEnvById } from '@/lib/fetcher';

interface EnvPageProps {
  params: { id: string };
}

export default async function EnvDashboard({ params }: EnvPageProps) {
  const env = await getEnvById(params.id);

  if (!env) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/40 p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-foreground/60">Env ID: {env.id}</p>
          <h2 className="text-2xl font-semibold">{env.name}</h2>
          <p className="text-sm text-foreground/60">Region: {env.region}</p>
        </div>
        <StatusPill status={env.status} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
          <h3 className="text-sm font-semibold">Deployment timeline</h3>
          <p className="text-xs text-foreground/60">TODO(prism-next): render chart from CORE_HUB stream.</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
          <h3 className="text-sm font-semibold">Agent roster</h3>
          <p className="text-xs text-foreground/60">TODO(prism-next): list agents once BEACON is wired.</p>
        </div>
      </div>
    </div>
  );
}
