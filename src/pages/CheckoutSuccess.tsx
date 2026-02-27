import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CheckoutSuccess() {
  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-xl">
        <Card className="border-emerald-200 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="h-6 w-6" />
              Compra confirmada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Seu checkout foi concluido com sucesso. A ativacao do plano sera
              processada em instantes.
            </p>
            <Button asChild className="w-full">
              <Link to="/login">Ir para o acesso</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

