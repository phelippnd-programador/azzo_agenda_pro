import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number | null;
    isPositive: boolean;
    unavailableLabel?: string;
  };
  className?: string;
  iconClassName?: string;
  compact?: boolean;
  wrapValue?: boolean;
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  className,
  iconClassName,
  compact = false,
  wrapValue = false,
}: MetricCardProps) {
  return (
    <Card
      className={cn(
        'border-border/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,249,252,0.92))] shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-panel dark:bg-[linear-gradient(180deg,rgba(17,24,39,0.96),rgba(15,23,42,0.92))]',
        className
      )}
    >
      <CardContent className={cn(compact ? 'p-4' : 'p-4 sm:p-6')}>
        <div className="flex items-start justify-between gap-2">
          <div className={cn('min-w-0 flex-1', compact ? 'space-y-1' : 'space-y-1 sm:space-y-2')}>
            <p
              className={cn(
                'font-medium uppercase tracking-[0.14em] text-muted-foreground',
                compact ? 'line-clamp-2 text-[11px]' : 'truncate text-[11px] sm:text-xs'
              )}
            >
              {title}
            </p>
            <p
              className={cn(
                'font-bold text-foreground',
                compact ? 'text-lg' : 'text-lg sm:text-2xl',
                wrapValue ? 'break-words whitespace-normal leading-tight' : 'truncate'
              )}
            >
              {value}
            </p>
            {trend && (
              trend.value == null ? (
                <p className={cn('font-medium text-muted-foreground', compact ? 'text-xs' : 'text-xs sm:text-sm')}>
                  {trend.unavailableLabel || 'Sem dados anteriores'}
                </p>
              ) : (
                <p
                  className={cn(
                    compact ? 'text-xs font-medium' : 'text-xs sm:text-sm font-medium',
                    trend.isPositive ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {trend.isPositive ? '+' : '-'}
                  {Math.abs(trend.value).toFixed(1)}%
                  <span className={cn('text-muted-foreground ml-1', compact ? 'inline' : 'hidden sm:inline')}>
                    vs. periodo anterior
                  </span>
                </p>
              )
            )}
          </div>
          <div
            className={cn(
              compact
                ? 'h-10 w-10 rounded-2xl flex items-center justify-center flex-shrink-0 ring-1 ring-white/60 shadow-soft'
                : 'w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ring-1 ring-white/60 shadow-soft',
              iconClassName || 'bg-primary/12'
            )}
          >
            <Icon
              className={cn(
                compact ? 'h-5 w-5' : 'w-5 h-5 sm:w-6 sm:h-6',
                iconClassName ? 'text-white' : 'text-primary'
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
