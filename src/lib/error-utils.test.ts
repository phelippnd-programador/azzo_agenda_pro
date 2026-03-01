import { ApiError } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";

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
});
