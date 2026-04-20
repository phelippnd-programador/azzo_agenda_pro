import { AlertTriangle, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type StateAction = {
  label: string;
  onClick: () => void;
  variant?: "default" | "outline";
};

type PageStateProps = {
  title: string;
  description: string;
  action?: StateAction;
};

export function PageErrorState({ title, description, action }: PageStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-12 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10">
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
    <Card className="border-dashed">
      <CardContent className="py-12 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
          <Inbox className="h-6 w-6 text-primary" />
        </div>
        <p className="text-base font-semibold text-foreground">{title}</p>
        <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
        {action ? (
          <Button className="mt-4" variant={action.variant ?? "default"} onClick={action.onClick}>
            {action.label}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
