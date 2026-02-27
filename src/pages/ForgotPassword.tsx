import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, Mail, Scissors } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email.trim()) {
      toast.error("Informe seu e-mail para recuperar a senha.");
      return;
    }

    try {
      setIsSubmitting(true);
      await new Promise((resolve) => setTimeout(resolve, 700));
      toast.success("Se o e-mail existir, voce recebera instrucoes de recuperacao.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-card p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-6 sm:mb-8">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-xl flex items-center justify-center">
            <Scissors className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Azzo</h1>
            <p className="text-xs sm:text-sm text-primary font-medium -mt-1">Agenda Pro</p>
          </div>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-2 sm:pb-4">
            <CardTitle className="text-xl sm:text-2xl">Recuperar senha</CardTitle>
            <CardDescription className="text-sm">
              Digite seu e-mail para receber instrucoes de redefinicao.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
