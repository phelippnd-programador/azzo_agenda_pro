import { AlertTriangle, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type StateAction = {
  label: string;
  onClick: () => void;
};

type PageStateProps = {
  title: string;
  description: string;
  action?: StateAction;
};

export function PageErrorState({ title, description, action }: PageStateProps) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-destructive" />
        <p className="text-base font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        {action ? (
          <Button className="mt-4" variant="outline" onClick={action.onClick}>
            {action.label}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function PageEmptyState({ title, description, action }: PageStateProps) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <Inbox className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
        <p className="text-base font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        {action ? (
          <Button className="mt-4" variant="outline" onClick={action.onClick}>
            {action.label}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
