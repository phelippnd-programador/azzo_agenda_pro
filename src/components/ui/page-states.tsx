import { AlertTriangle, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type StateAction = {
  label: string;
  onClick: () => void;
  variant?: "default" | "outline";
  disabled?: boolean;
};

type PageStateProps = {
  title: string;
  description: string;
  action?: StateAction;
};

export function PageErrorState({ title, description, action }: PageStateProps) {
  return (
    <Card className="border-dashed border-destructive/25 bg-card/90 shadow-none">
      <CardContent className="py-12 text-center sm:py-14">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 ring-1 ring-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <p className="text-base font-semibold text-foreground">{title}</p>
        <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
        {action ? (
          <Button className="mt-4" variant={action.variant ?? "outline"} onClick={action.onClick}>
            {action.label}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function PageEmptyState({ title, description, action }: PageStateProps) {
  return (
    <Card className="border-dashed border-border/80 bg-card/90 shadow-none">
      <CardContent className="py-12 text-center sm:py-14">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/10">
          <Inbox className="h-6 w-6 text-primary" />
        </div>
        <p className="text-base font-semibold text-foreground">{title}</p>
        <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
        {action ? (
          <Button
            className="mt-4"
            variant={action.variant ?? "default"}
            onClick={action.onClick}
            disabled={action.disabled}
          >
            {action.label}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

type PageListLoadingStateProps = {
  metricCount?: number;
  itemCount?: number;
  itemHeightClassName?: string;
};

export function PageListLoadingState({
  metricCount = 3,
  itemCount = 6,
  itemHeightClassName = "h-48",
}: PageListLoadingStateProps) {
  return (
    <div className="space-y-4 sm:space-y-6" aria-live="polite" aria-busy="true">
      <Card className="border-border/70 bg-card/90 shadow-none">
        <CardContent className="space-y-4 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-28 rounded-full" />
              <Skeleton className="h-5 w-72 max-w-full rounded-full" />
              <Skeleton className="h-4 w-[30rem] max-w-full rounded-full" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Skeleton className="h-12 w-full rounded-xl" />

      {metricCount > 0 ? (
        <div className="grid gap-3 md:grid-cols-3 sm:gap-4">
          {Array.from({ length: metricCount }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {Array.from({ length: itemCount }).map((_, index) => (
          <Skeleton key={index} className={`${itemHeightClassName} rounded-2xl`} />
        ))}
      </div>
    </div>
  );
}
