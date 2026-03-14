import { buildStockSummary, getListItems } from "@/pages/stock/utils";
import type { StockItem, StockMovement } from "@/types/stock";

describe("stock utils", () => {
  it("buildStockSummary should aggregate stock totals", () => {
    const items: StockItem[] = [
      {
        id: "1",
        nome: "Shampoo",
        unidadeMedida: "UN",
        saldoAtual: 0,
        estoqueMinimo: 2,
        custoMedioUnitario: 10,
        ativo: true,
      },
      {
        id: "2",
        nome: "Pomada",
        unidadeMedida: "UN",
        saldoAtual: 5,
        estoqueMinimo: 3,
        custoMedioUnitario: 8,
        ativo: true,
      },
    ];
    const movements: StockMovement[] = [
      {
        id: "m1",
        itemEstoqueId: "1",
        tipo: "ENTRADA",
        quantidade: 3,
        saldoAnterior: 0,
        saldoPosterior: 3,
        motivo: "Compra",
        origem: "COMPRA",
        createdAt: new Date().toISOString(),
      },
    ];

    const result = buildStockSummary(items, movements);
    expect(result.totalItens).toBe(2);
    expect(result.totalMovimentacoes).toBe(1);
    expect(result.itensZerados).toBe(1);
    expect(result.itensAbaixoMinimo).toBe(1);
    expect(result.valorEstoque).toBe(40);
  });

  it("getListItems should normalize array and object response", () => {
    expect(getListItems([1, 2, 3])).toEqual([1, 2, 3]);
    expect(getListItems({ items: [1, 2] })).toEqual([1, 2]);
    expect(getListItems(null)).toEqual([]);
  });
});
