import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BrandLockup } from "@/components/common/BrandLockup";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api/auth";
import { resolveUiError } from "@/lib/error-utils";
import { forgotPasswordSchema, type ForgotPasswordForm } from "@/schemas/auth";

export default function ForgotPassword() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      setIsSubmitting(true);
      const response = await authApi.forgotPassword(values.email);
      toast.success(response.message || "Se o e-mail existir, voce recebera instrucoes de recuperacao.");
      form.reset({ email: "" });
    } catch (error) {
      toast.error(resolveUiError(error, "Nao foi possivel solicitar a redefinicao de senha.").message);
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
      <div className="relative z-10 w-full max-w-md pt-2 sm:pt-0">
        <div className="mb-6 space-y-3 text-center sm:mb-8">
          <div className="flex justify-center">
            <span className="brand-orbit-badge">
              <span className="brand-orbit-dot" />
              Recuperacao segura
            </span>
          </div>
          <p className="section-eyebrow">Acesso protegido</p>
          <BrandLockup className="justify-center" caption="Operating System" />
          <p className="mx-auto max-w-sm text-sm leading-6 text-muted-foreground">
            Informe seu e-mail e receba um caminho seguro para voltar ao ambiente operacional.
          </p>
        </div>

        <Card className="auth-panel border-border/80">
          <CardHeader className="text-center pb-2 sm:pb-4">
            <CardTitle className="text-2xl font-semibold tracking-tight sm:text-[2rem]">
              Recuperar senha
            </CardTitle>
            <CardDescription className="text-sm leading-6 sm:text-[15px]">
              Digite seu e-mail para receber instrucoes de redefinicao.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">
                  E-mail
                </Label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    {...form.register("email")}
                    className="h-10 sm:h-11 pl-9"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-10 sm:h-11" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar instrucoes"
                )}
              </Button>
            </form>

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
