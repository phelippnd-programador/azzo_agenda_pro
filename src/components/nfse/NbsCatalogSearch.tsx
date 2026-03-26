import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NFSE_NBS_CATALOG } from "@/lib/nfseNbsCatalog";

interface NbsCatalogSearchProps {
  onSelect: (code: string) => void;
}

export function NbsCatalogSearch({ onSelect }: NbsCatalogSearchProps) {
  const [nbsSearch, setNbsSearch] = useState("");

  const nbsMatches = useMemo(() => {
    const needle = nbsSearch.trim().toLowerCase();
    if (!needle) return [];
    return NFSE_NBS_CATALOG.filter(
      (entry) =>
        entry.code.includes(needle) || entry.description.toLowerCase().includes(needle),
    ).slice(0, 8);
  }, [nbsSearch]);

  return (
    <div className="space-y-2 rounded-md border p-3">
      <Label>Busca local NBS (apoio)</Label>
      <Input
        value={nbsSearch}
        onChange={(e) => setNbsSearch(e.target.value)}
        placeholder="Digite codigo ou descricao NBS"
      />
      {nbsSearch.trim() ? (
        <div className="max-h-44 overflow-auto rounded border">
          {nbsMatches.length === 0 ? (
            <p className="p-2 text-sm text-muted-foreground">Nenhum codigo NBS encontrado.</p>
          ) : (
            <ul className="divide-y text-sm">
              {nbsMatches.map((entry) => (
                <li key={entry.code} className="flex items-start justify-between gap-2 p-2">
                  <div>
                    <p className="font-medium">{entry.code}</p>
                    <p className="text-muted-foreground">{entry.description}</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onSelect(entry.code);
                      setNbsSearch("");
                    }}
                  >
                    Usar
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
