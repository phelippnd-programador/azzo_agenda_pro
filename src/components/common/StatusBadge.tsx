import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type StatusBadgeLabelMap = Record<string, string>;
export type StatusBadgeToneMap = Record<string, string>;

interface StatusBadgeProps {
  status?: string | null;
  labelMap?: StatusBadgeLabelMap;
  toneMap: StatusBadgeToneMap;
  fallbackStatus?: string;
  className?: string;
}

export function StatusBadge({
  status,
  labelMap,
  toneMap,
  fallbackStatus = 'PENDING',
  className,
}: StatusBadgeProps) {
  const resolvedStatus = status && toneMap[status] ? status : fallbackStatus;
  const toneClass = toneMap[resolvedStatus] ?? '';
  const label = labelMap?.[resolvedStatus] ?? resolvedStatus;

  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center rounded-full whitespace-nowrap border px-2 py-1 text-[10px] font-medium leading-none',
        toneClass,
        className,
      )}
    >
      {label}
    </Badge>
  );
}
