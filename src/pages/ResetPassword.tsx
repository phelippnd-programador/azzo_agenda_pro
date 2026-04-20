import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, KeyRound, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BrandLockup } from "@/components/common/BrandLockup";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import { resetPasswordSchema, type ResetPasswordForm } from "@/schemas/auth";

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-card p-4">
      <div className="w-full max-w-md">
        <BrandLockup className="mb-6 sm:mb-8" />

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-2 sm:pb-4">
            <CardTitle className="text-2xl font-semibold tracking-tight sm:text-[2rem]">
              Definir nova senha
            </CardTitle>
            <CardDescription className="text-sm leading-6 sm:text-[15px]">
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
                    <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Digite sua nova senha"
                      {...form.register("password")}
                      className="h-10 sm:h-11 pl-9"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm">
                    Confirmar senha
                  </Label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirme a nova senha"
                      {...form.register("confirmPassword")}
                      className="h-10 sm:h-11 pl-9"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-10 sm:h-11" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Redefinir senha"
                  )}
                </Button>
              </form>
            )}

            <Button asChild variant="ghost" className="w-full mt-3">
              <Link to="/login">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para login
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
