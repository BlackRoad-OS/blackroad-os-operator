import Link from 'next/link';
import { StatusPill } from '@/components/StatusPill';
import type { Env } from '@/types';

export function EnvCard({ env }: { env: Env }) {
  return (
    <Link
      href={`/env/${env.id}`}
      className="block rounded-2xl border border-border/60 bg-muted/40 p-4 transition hover:-translate-y-1 hover:border-accent/60 hover:shadow-lg hover:shadow-accent/10"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-foreground/60">{env.region}</p>
          <h2 className="text-lg font-semibold">{env.name}</h2>
          <p className="text-sm text-foreground/70">Env ID: {env.id}</p>
        </div>
        <StatusPill status={env.status} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-foreground/70">
        <div>
          <p className="text-foreground/60">Agents</p>
          <p className="text-base font-medium text-foreground">{env.agentCount ?? 0}</p>
        </div>
        <div>
          <p className="text-foreground/60">Last deploy</p>
          <p className="text-base font-medium text-foreground">
            {env.lastDeploy ? env.lastDeploy.version : 'n/a'}
          </p>
        </div>
      </div>
    </Link>
  );
}
