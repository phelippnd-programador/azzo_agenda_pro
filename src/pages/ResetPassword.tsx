import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, KeyRound, Loader2, Lock, X } from "lucide-react";
import { toast } from "sonner";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BrandLockup } from "@/components/common/BrandLockup";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api/auth";
import { resolveUiError } from "@/lib/error-utils";
import { PASSWORD_RULES, resetPasswordSchema, type ResetPasswordForm } from "@/schemas/auth";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default function ResetPassword() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";
  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const passwordValue = useWatch({ control: form.control, name: "password" });
  const allRulesMet = PASSWORD_RULES.every((r) => r.test(passwordValue ?? ""));

  const onSubmit = form.handleSubmit(async (values) => {
    if (!token) {
      toast.error("Token de redefinicao ausente ou invalido.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await authApi.resetPassword(token, values.password);
      toast.success(response.message || "Senha redefinida com sucesso.");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(resolveUiError(error, "Nao foi possivel redefinir a senha.").message);
    } finally {
      setIsSubmitting(false);
    }
  }, (errors) => {
    const firstError = Object.values(errors)[0];
    if (firstError?.message) {
      toast.error(firstError.message);
    }
  });

  return (
    <div className="auth-shell flex items-start justify-center sm:items-center">
      <div className="absolute right-3 top-3 z-20 sm:right-6 sm:top-6">
        <ThemeToggle className="theme-toggle-shell h-10 w-10" />
      </div>
      <div className="relative z-10 w-full max-w-md pt-2 sm:pt-0">
        <div className="mb-6 space-y-3 text-center sm:mb-8">
          <div className="flex justify-center">
            <span className="brand-orbit-badge">
              <span className="brand-orbit-dot" />
              Redefinicao protegida
            </span>
          </div>
          <p className="section-eyebrow">Acesso protegido</p>
          <BrandLockup className="justify-center" caption="Operating System" />
          <p className="mx-auto max-w-sm text-sm leading-6 text-muted-foreground">
            Defina uma nova senha e retorne ao mesmo fluxo operacional do restante da plataforma.
          </p>
        </div>

        <Card className="auth-panel border-border/80">
          <CardHeader className="pb-2 text-center sm:pb-4">
            <CardTitle className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Definir nova senha
            </CardTitle>
            <CardDescription className="text-sm leading-6">
              Informe sua nova senha para concluir a recuperacao de acesso.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!token ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
                  Link de redefinicao invalido ou expirado.
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/recuperar-senha">Solicitar novo link</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm">
                    Nova senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Digite sua nova senha"
                      {...form.register("password")}
                      className="h-10 pl-9 sm:h-11"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Requisitos da senha */}
                  {(passwordValue?.length ?? 0) > 0 && (
                    <div className="rounded-lg border border-border/60 bg-muted/40 p-3 space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Requisitos da senha:</p>
                      {PASSWORD_RULES.map((rule) => {
                        const ok = rule.test(passwordValue ?? "");
                        return (
                          <div key={rule.id} className="flex items-center gap-2">
                            {ok ? (
                              <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                            ) : (
                              <X className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                            )}
                            <span className={`text-xs ${ok ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                              {rule.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm">
                    Confirmar senha
                  </Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirme a nova senha"
                      {...form.register("confirmPassword")}
                      className="h-10 pl-9 sm:h-11"
                      disabled={isSubmitting}
                    />
                  </div>
                  {form.formState.errors.confirmPassword && (
                    <p className="text-xs text-destructive">{form.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="h-10 w-full sm:h-11"
                  disabled={isSubmitting || !allRulesMet}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Redefinir senha"
                  )}
                </Button>
              </form>
            )}

            <Button asChild variant="ghost" className="mt-3 w-full">
              <Link to="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para login
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
