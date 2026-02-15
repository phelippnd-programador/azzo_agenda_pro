import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  iconClassName?: string;
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  className,
  iconClassName,
}: MetricCardProps) {
  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 sm:space-y-2 min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">{title}</p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{value}</p>
            {trend && (
              <p
                className={cn(
                  'text-xs sm:text-sm font-medium',
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                )}
              >
                {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
                <span className="text-gray-500 ml-1 hidden sm:inline">vs. mês anterior</span>
              </p>
            )}
          </div>
          <div
            className={cn(
              'w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0',
              iconClassName || 'bg-violet-100'
            )}
          >
            <Icon className={cn('w-5 h-5 sm:w-6 sm:h-6', iconClassName ? 'text-white' : 'text-violet-600')} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}