import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CheckoutError() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-xl">
        <Card className="border-rose-200 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-rose-700">
              <AlertTriangle className="h-6 w-6" />
              Nao foi possivel concluir o pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-600">
            <p>
              Ocorreu um erro na confirmacao da intent. Tente novamente pela pagina
              de venda.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link to="/compras">Voltar para oferta</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
