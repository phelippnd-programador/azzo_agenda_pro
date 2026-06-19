import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type StockFeaturePlaceholderPageProps = {
  title: string;
  description: string;
};

export default function StockFeaturePlaceholderPage({
  title,
  description,
}: StockFeaturePlaceholderPageProps) {
  return (
    <Card className="border-border/80">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
          <p className="mt-1 text-sm text-foreground">Fluxo previsto e reservado para a proxima fase do modulo.</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Tela em preparacao para a fase evolutiva do modulo de estoque.
        </p>
      </CardContent>
    </Card>
  );
}
