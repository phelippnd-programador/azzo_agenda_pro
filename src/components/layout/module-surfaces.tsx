import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type ModuleIntroBadge = {
  label: string;
};

type ModuleIntroPoint = {
  eyebrow: string;
  title: string;
  description: string;
};

type ModuleIntroProps = {
  eyebrow: string;
  title: string;
  description: string;
  badges?: ModuleIntroBadge[];
  points?: ModuleIntroPoint[];
  actions?: ReactNode;
  className?: string;
};

export function ModuleIntro({
  eyebrow,
  title,
  description,
  badges = [],
  points = [],
  actions,
  className,
}: ModuleIntroProps) {
  return (
    <Card className={cn('border-border/70 bg-card/90 shadow-[0_12px_36px_-28px_rgba(15,23,42,0.16)]', className)}>
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {eyebrow}
            </p>
            <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">{title}</h2>
            <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>
          </div>
          {badges.length > 0 ? (
            <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
              {badges.map((badge) => (
                <Badge key={badge.label} variant="outline" className="bg-background/80">
                  {badge.label}
                </Badge>
              ))}
            </div>
          ) : null}
          {actions ? (
            <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
              {actions}
            </div>
          ) : null}
        </div>

        {points.length > 0 ? (
          <div className={cn('grid gap-3', points.length >= 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2')}>
            {points.map((point) => (
              <div key={`${point.eyebrow}-${point.title}`} className="rounded-2xl border border-border/70 bg-background/80 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {point.eyebrow}
                </p>
                <h3 className="mt-2 text-sm font-medium text-foreground">{point.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{point.description}</p>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

type WorkspaceNoticeProps = {
  title: string;
  description: string;
  badge?: string;
  className?: string;
};

export function WorkspaceNotice({ title, description, badge, className }: WorkspaceNoticeProps) {
  return (
    <div className={cn('rounded-2xl border border-border/70 bg-card/75 p-3 sm:p-4', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {badge ? (
          <div className="rounded-full bg-primary/8 px-3 py-1 text-xs font-medium text-primary">
            {badge}
          </div>
        ) : null}
      </div>
    </div>
  );
}
