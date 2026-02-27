import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CheckoutProduct } from "@/types/checkout";

interface ProductOfferCardProps {
  product: CheckoutProduct;
  selected: boolean;
  onSelect: (productId: string) => void;
}

export function ProductOfferCard({
  product,
  selected,
  onSelect,
}: ProductOfferCardProps) {
  const formattedPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: product.currency || "BRL",
  }).format(product.price);

  return (
    <Card
      className={cn(
        "border-border transition-all",
        selected && "border-emerald-400 shadow-md ring-2 ring-emerald-100"
      )}
    >
      <CardContent className="p-5">
        {product.highlight ? (
          <p className="text-xs font-medium text-emerald-700">{product.highlight}</p>
        ) : null}
        <h3 className="mt-1 text-lg font-semibold text-foreground">{product.name}</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {product.description || "Plano recomendado para acelerar suas vendas."}
        </p>
        <p className="mt-4 text-2xl font-bold text-foreground">{formattedPrice}</p>
        {product.features?.length ? (
          <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
            {product.features.slice(0, 3).map((feature) => (
              <li key={feature}>- {feature}</li>
            ))}
          </ul>
        ) : null}
        <Button
          type="button"
          className="mt-4 w-full"
          variant={selected ? "default" : "outline"}
          onClick={() => onSelect(product.id)}
        >
          {selected ? "Produto selecionado" : "Selecionar produto"}
        </Button>
      </CardContent>
    </Card>
  );
}

