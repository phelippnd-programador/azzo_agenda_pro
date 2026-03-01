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
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">{description}</p>
        <p className="text-xs text-muted-foreground">
          Tela em preparacao para a fase evolutiva do modulo de estoque.
        </p>
      </CardContent>
    </Card>
  );
}
