import { ApiError } from "@/lib/api";
import {
  requiresFiscalTaxConfiguration,
  requiresNfseConfiguration,
  resolveUiError,
} from "@/lib/error-utils";

describe("resolveUiError", () => {
  it("should prioritize backend message when available", () => {
    const error = new ApiError("fallback", 400, {
      code: "BAD_REQUEST",
      message: "Mensagem de negocio",
    });

    const result = resolveUiError(error, "fallback ui");
    expect(result.message).toBe("Mensagem de negocio");
    expect(result.code).toBe("BAD_REQUEST");
  });

  it("should map constraint violations when message is not provided", () => {
    const error = new ApiError("fallback", 400, {
      title: "Constraint Violation",
      status: 400,
      violations: [
        {
          field: "register.arg0.privacyPolicyVersion",
          message: "nao deve estar em branco",
        },
      ],
    });

    const result = resolveUiError(error, "fallback ui");
    expect(result.message).toContain("privacyPolicyVersion");
    expect(result.message).toContain("nao deve estar em branco");
  });

  it("should map invalid stock origin enum errors to a friendly message", () => {
    const error = new ApiError("fallback", 400, {
      code: "BAD_REQUEST",
      message:
        'Cannot deserialize value of type `br.com.phdigitalcode.azzo.agenda.pro.modules.inventory.domain.enums.OrigemMovimentacaoEstoque` from String "FOO": not one of the values accepted for Enum class: [MANUAL, COMPRA, SERVICO, INVENTARIO]',
    });

    const result = resolveUiError(error, "fallback ui");
    expect(result.message).toBe(
      "Valor invalido para origem da movimentacao. Use: MANUAL, COMPRA, SERVICO ou INVENTARIO."
    );
  });

  it("should map invalid stock movement type enum errors to a friendly message", () => {
    const error = new ApiError("fallback", 400, {
      code: "BAD_REQUEST",
      message:
        "No enum constant br.com.phdigitalcode.azzo.agenda.pro.modules.inventory.domain.enums.TipoMovimentacaoEstoque.TESTE",
    });

    const result = resolveUiError(error, "fallback ui");
    expect(result.message).toBe(
      "Valor invalido para tipo da movimentacao. Use: ENTRADA, SAIDA ou AJUSTE."
    );
  });

  it("should identify when nfse configuration is required before authorization", () => {
    const error = new ApiError("fallback", 400, {
      code: "NFSE_PROVIDER_SEFIN_NACIONAL_CONFIG_MISSING",
      message: "Configuracao NFS-e nacional nao encontrada para o ambiente informado.",
    });

    expect(requiresNfseConfiguration(error)).toBe(true);
  });

  it("should identify when fiscal tax configuration is required before authorization", () => {
    const error = new ApiError("fallback", 400, {
      code: "NFSE_PROVIDER_SEFIN_NACIONAL_TAX_CONFIG_MISSING",
      message: "Configuracao fiscal do emissor nao encontrada.",
    });

    expect(requiresFiscalTaxConfiguration(error)).toBe(true);
  });
});
