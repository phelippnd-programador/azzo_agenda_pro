import { Button } from "@/components/ui/button";

type PaginationControlsProps = {
  page: number;
  totalPages: number;
  isLoading?: boolean;
  hasNextPage?: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

export function PaginationControls({
  page,
  totalPages,
  isLoading = false,
  hasNextPage = true,
  onPrevious,
  onNext,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-muted/15 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
      <p className="text-sm text-muted-foreground">
        Página {page} de {totalPages}
      </p>
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <Button variant="outline" size="sm" className="min-w-24" onClick={onPrevious} disabled={page <= 1 || isLoading}>
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="min-w-24"
          onClick={onNext}
          disabled={page >= totalPages || isLoading || !hasNextPage}
        >
          Próxima
        </Button>
      </div>
    </div>
  );
}
