import clsx from 'clsx';
import type { EnvStatus } from '@/types';

const labelMap: Record<EnvStatus, string> = {
  healthy: 'Healthy',
  degraded: 'Degraded',
  down: 'Down'
};

const colorMap: Record<EnvStatus, string> = {
  healthy: 'bg-green-500/20 text-green-200 border-green-500/40',
  degraded: 'bg-yellow-500/20 text-yellow-200 border-yellow-500/40',
  down: 'bg-red-500/20 text-red-200 border-red-500/40'
};

export function StatusPill({ status }: { status: EnvStatus }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium',
        colorMap[status]
      )}
    >
      <span className="h-2 w-2 rounded-full bg-current" />
      {labelMap[status]}
    </span>
  );
}
