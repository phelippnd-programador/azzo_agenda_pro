import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BadgeCheck, MousePointerClick, Shield, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { BenefitCard } from "@/components/sales/BenefitCard";
import { CheckoutIntentPanel } from "@/components/sales/CheckoutIntentPanel";
import { ProductOfferCard } from "@/components/sales/ProductOfferCard";
import { SalesSection } from "@/components/sales/SalesSection";
import { useCheckout } from "@/hooks/useCheckout";
import { useCheckoutProducts } from "@/hooks/useCheckoutProducts";

export default function SalePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { productId } = useParams();
  const routeProductId = useMemo(() => productId ?? "", [productId]);
  const queryProductId = searchParams.get("product");
  const selectedProductId = queryProductId || routeProductId;
  const [lastActionAt, setLastActionAt] = useState<number | null>(null);
  const { products, isLoading: isLoadingProducts, error: productsError } =
    useCheckoutProducts();

  const {
    state,
    intent,
    error,
    isConfirming,
    createIntent,
    confirmIntent,
    revalidateIntent,
    formattedTotalPrice,
    isExpired,
  } = useCheckout(selectedProductId);

  const selectedProduct = useMemo(
    () => products.find((item) => item.id === selectedProductId) ?? null,
    [products, selectedProductId]
  );

  useEffect(() => {
    const title = "Azzo Agenda Pro | Oferta para digitalizar seu salao";
    const description =
      "Converta atendimentos em faturamento com agenda inteligente, equipe conectada e checkout seguro.";
    document.title = title;

    let meta = document.querySelector(
      'meta[name="description"]'
    ) as HTMLMetaElement | null;

    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = description;
  }, []);

  useEffect(() => {
    if (!products.length) return;
    if (selectedProductId && products.some((item) => item.id === selectedProductId)) {
      return;
    }
    const first = products[0];
    setSearchParams({ product: first.id }, { replace: true });
  }, [products, selectedProductId, setSearchParams]);

  const handleSelectProduct = (nextProductId: string) => {
    setSearchParams({ product: nextProductId }, { replace: true });
  };

  const handleStartCheckout = async () => {
    setLastActionAt(Date.now());
    await createIntent();
  };

  const handleConfirmCheckout = async () => {
    const response = await confirmIntent();
    if (!response) return;

    if (response.status === "CONFIRMED") {
      navigate("/success", { replace: true });
      return;
    }
    navigate("/error", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-slate-50 text-slate-900">
      <SalesSection className="pt-10 md:pt-16">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-medium text-emerald-700">
              <Sparkles className="h-3.5 w-3.5" />
              Oferta especial para saloes
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">
              Fature mais com um ERP pensado para a rotina real do seu salao
            </h1>
            <p className="mt-4 text-base text-slate-600 md:text-lg">
              Automatize agenda, financeiro e equipe com fluxo simples e checkout
              seguro por intent no backend.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={handleStartCheckout}
              >
                Quero ativar meu plano agora
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/login">Entrar no sistema</Link>
              </Button>
            </div>
          </div>
          <Card className="border-emerald-100 bg-white shadow-xl">
            <CardContent className="p-6">
              <p className="text-sm text-slate-500">Oferta ativa para produto</p>
              <p className="mt-1 break-all font-mono text-sm text-slate-700">
                {selectedProduct?.name ?? "Produto selecionado"}
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-slate-500">Checkout</p>
                  <p className="font-semibold text-slate-900">Intent segura</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-slate-500">Risco</p>
                  <p className="font-semibold text-slate-900">Preco blindado</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SalesSection>

      <SalesSection
        title="Seu salao perde vendas por friccao operacional?"
        subtitle="Agendas desalinhadas, confirmacoes manuais e retrabalho financeiro travam crescimento."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {[
            "Equipe sem visao unica dos horarios",
            "Cancelamentos por falta de confirmacao rapida",
            "Dificuldade para fechar faturamento com confianca",
          ].map((pain) => (
            <Card key={pain} className="border-slate-200">
              <CardContent className="p-5 text-sm text-slate-700">{pain}</CardContent>
            </Card>
          ))}
        </div>
      </SalesSection>

      <SalesSection
        className="bg-white"
        title="Beneficios diretos em receita e produtividade"
        subtitle="Projetado para conversao: menos atrito e mais previsibilidade."
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <BenefitCard
            icon={<Zap className="h-5 w-5" />}
            title="Ativacao rapida"
            description="Comece em minutos com onboarding objetivo e fluxo de compra simples."
          />
          <BenefitCard
            icon={<BadgeCheck className="h-5 w-5" />}
            title="Operacao organizada"
            description="Agenda, clientes e financeiro no mesmo painel."
          />
          <BenefitCard
            icon={<Shield className="h-5 w-5" />}
            title="Checkout seguro"
            description="Preco e validade definidos exclusivamente no backend por intent."
          />
          <BenefitCard
            icon={<MousePointerClick className="h-5 w-5" />}
            title="UX de alta conversao"
            description="CTAs claros, oferta objetiva e menos passos para confirmar."
          />
        </div>
      </SalesSection>

      <SalesSection title="Veja como sua operacao evolui em um unico painel">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-100 to-white p-4 md:p-8">
          <div className="mx-auto max-w-4xl overflow-hidden rounded-xl border bg-white shadow-lg">
            <img
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1920&auto=format&fit=crop"
              alt="Painel demonstrativo de gestao"
              loading="lazy"
              className="h-56 w-full object-cover md:h-80"
            />
          </div>
        </div>
      </SalesSection>

      <SalesSection title="Prova social" subtitle="Espaco reservado para depoimentos validados.">
        <div className="grid gap-4 md:grid-cols-3">
          {["Salao Aurora", "Studio Prime", "Bella Cabelo e Estetica"].map((brand) => (
            <Card key={brand} className="border-slate-200">
              <CardContent className="p-5 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">{brand}</p>
                <p className="mt-2">
                  "Placeholder de depoimento: resultados reais de produtividade e aumento
                  de receita."
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </SalesSection>

      <SalesSection
        className="bg-white"
        title="Produtos disponiveis no app"
        subtitle="Escolha um produto real retornado pelo backend para criar a intent."
      >
        {isLoadingProducts ? (
          <Alert className="border-slate-200 bg-slate-50">
            <AlertTitle>Carregando produtos</AlertTitle>
            <AlertDescription>
              Consultando catalogo de produtos no backend.
            </AlertDescription>
          </Alert>
        ) : null}
        {productsError ? (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Falha ao listar produtos</AlertTitle>
            <AlertDescription>{productsError}</AlertDescription>
          </Alert>
        ) : null}
        {!isLoadingProducts && !products.length && !productsError ? (
          <Alert className="border-amber-200 bg-amber-50 text-amber-900">
            <AlertTitle>Nenhum produto encontrado</AlertTitle>
            <AlertDescription>
              O backend nao retornou produtos para venda neste momento.
            </AlertDescription>
          </Alert>
        ) : null}
        {products.length ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {products.map((item) => (
              <ProductOfferCard
                key={item.id}
                product={item}
                selected={item.id === selectedProductId}
                onSelect={handleSelectProduct}
              />
            ))}
          </div>
        ) : null}
      </SalesSection>

      <SalesSection id="offer" className="bg-white" title="Plano recomendado">
        {state === "loading" ? (
          <Alert className="mb-4 border-slate-200 bg-slate-50">
            <AlertTitle>Gerando checkout</AlertTitle>
            <AlertDescription>
              Estamos validando o produto e carregando os valores diretamente do backend.
            </AlertDescription>
          </Alert>
        ) : null}
        {state === "expired" ? (
          <Alert className="mb-4 border-amber-200 bg-amber-50 text-amber-900">
            <AlertTitle>Intent expirada</AlertTitle>
            <AlertDescription>
              Clique em revalidar para gerar uma nova intent antes de confirmar o pagamento.
            </AlertDescription>
          </Alert>
        ) : null}
        {state === "success" && intent ? (
          <Alert className="mb-4 border-emerald-200 bg-emerald-50 text-emerald-900">
            <AlertTitle>Intent pronta para confirmacao</AlertTitle>
            <AlertDescription>
              Checkout seguro criado com sucesso para {intent.productName}.
            </AlertDescription>
          </Alert>
        ) : null}
        <Card className="border-emerald-200 shadow-lg">
          <CardContent className="grid gap-6 p-6 md:grid-cols-2 md:p-8">
            <div>
              <p className="text-sm font-medium text-emerald-700">Oferta ativa</p>
              <h3 className="mt-2 text-2xl font-bold">
                {selectedProduct?.name || "Plano Pro Growth"}
              </h3>
              <p className="mt-3 text-sm text-slate-600">
                {selectedProduct?.description ||
                  "Inclui agenda inteligente, CRM de clientes, financeiro consolidado e checkout com intent segura."}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                <li>- Usuarios ilimitados da equipe</li>
                <li>- Relatorios gerenciais em tempo real</li>
                <li>- Suporte prioritario</li>
              </ul>
            </div>

            {intent && formattedTotalPrice ? (
              <CheckoutIntentPanel
                intent={intent}
                formattedPrice={formattedTotalPrice}
                isConfirming={isConfirming}
                expired={isExpired || state === "expired"}
                error={error}
                onRefreshIntent={revalidateIntent}
                onConfirm={handleConfirmCheckout}
              />
            ) : (
              <Card className="border-dashed border-slate-300">
                <CardContent className="p-6">
                  <p className="text-sm text-slate-600">
                    Clique no CTA para criar sua intent de checkout e ver preco/validade
                    vindos do backend.
                  </p>
                  <Button
                    className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700"
                    onClick={handleStartCheckout}
                    disabled={state === "loading"}
                  >
                    {state === "loading" ? "Carregando oferta..." : "Gerar checkout seguro"}
                  </Button>
                  {state === "error" && error ? (
                    <Alert variant="destructive" className="mt-4">
                      <AlertTitle>Erro ao gerar intent</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  ) : null}
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </SalesSection>

      <SalesSection>
        <div className="rounded-2xl bg-slate-900 px-6 py-10 text-center text-white">
          <h2 className="text-2xl font-bold md:text-3xl">
            Pronto para vender mais com menos friccao?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-200 md:text-base">
            Ative agora e confirme com checkout validado no servidor para garantir
            consistencia de preco e confianca no fechamento.
          </p>
          <Button
            size="lg"
            className="mt-6 bg-emerald-500 text-slate-900 hover:bg-emerald-400"
            onClick={handleStartCheckout}
          >
            Ativar plano com checkout seguro
          </Button>
          {lastActionAt ? (
            <p className="mt-3 text-xs text-slate-300">
              Ultima tentativa: {new Date(lastActionAt).toLocaleTimeString("pt-BR")}
            </p>
          ) : null}
        </div>
      </SalesSection>
    </div>
  );
}
