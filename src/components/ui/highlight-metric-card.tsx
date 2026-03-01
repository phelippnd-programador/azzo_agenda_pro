import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type HighlightMetricCardProps = {
  title: string;
  value: string;
  icon: LucideIcon;
  className?: string;
  titleClassName?: string;
  valueClassName?: string;
  iconContainerClassName?: string;
  iconClassName?: string;
};

export function HighlightMetricCard({
  title,
  value,
  icon: Icon,
  className,
  titleClassName,
  valueClassName,
  iconContainerClassName,
  iconClassName,
}: HighlightMetricCardProps) {
  return (
    <Card className={cn("border", className)}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className={cn("text-xs sm:text-sm font-medium", titleClassName)}>{title}</p>
            <p className={cn("text-xl sm:text-2xl font-bold", valueClassName)}>{value}</p>
          </div>
          <div
            className={cn(
              "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center",
              iconContainerClassName
            )}
          >
            <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6", iconClassName)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
