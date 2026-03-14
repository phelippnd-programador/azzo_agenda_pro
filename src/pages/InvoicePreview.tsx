import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { TaxPreview } from "@/components/fiscal/TaxPreview";
import { FiscalValidation } from "@/components/fiscal/FiscalValidation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaxRegime, TaxCalculation, CFOP_CODES, CST_CODES } from "@/types/fiscal";
import { calculateTaxes, formatCurrency } from "@/lib/tax-calculator";
import { Calculator, RefreshCw } from "lucide-react";
import { fiscalApi } from "@/lib/api";

type InvoiceAppointmentPayload = {
  appointment?: {
    totalPrice?: number;
    items?: Array<{
      totalPrice?: number;
      unitPrice?: number;
    }>;
  };
  client?: {
    document?: string;
    cpfCnpj?: string;
  };
  service?: {
    price?: number;
  };
  services?: Array<{
    price?: number;
  }>;
};

const DEFAULT_RATES = {
  [TaxRegime.SIMPLES_NACIONAL]: { icms: 4.0, pis: 0.65, cofins: 3.0 },
  [TaxRegime.LUCRO_PRESUMIDO]: { icms: 18.0, pis: 1.65, cofins: 7.6 },
};

export default function InvoicePreview() {
  const [serviceValue, setServiceValue] = useState<number>(0);
  const [regime, setRegime] = useState<TaxRegime>(TaxRegime.SIMPLES_NACIONAL);
  const [cfop, setCfop] = useState<string>("5.933");
  const [cst, setCst] = useState<string>("00");
  const [customerDocument, setCustomerDocument] = useState<string>("");
  const [calculation, setCalculation] = useState<TaxCalculation | undefined>(undefined);
  const [rates, setRates] = useState(DEFAULT_RATES);
  const [isTaxConfigLoaded, setIsTaxConfigLoaded] = useState(false);
  const [loadedFromAppointment, setLoadedFromAppointment] = useState(false);

  useEffect(() => {
    fiscalApi
      .getTaxConfig()
      .then((config) => {
        setRegime(config.regime);
        setRates({
          [TaxRegime.SIMPLES_NACIONAL]: {
            icms:
              config.regime === TaxRegime.SIMPLES_NACIONAL
                ? config.icmsRate
                : DEFAULT_RATES[TaxRegime.SIMPLES_NACIONAL].icms,
            pis:
              config.regime === TaxRegime.SIMPLES_NACIONAL
                ? config.pisRate
                : DEFAULT_RATES[TaxRegime.SIMPLES_NACIONAL].pis,
            cofins:
              config.regime === TaxRegime.SIMPLES_NACIONAL
                ? config.cofinsRate
                : DEFAULT_RATES[TaxRegime.SIMPLES_NACIONAL].cofins,
          },
          [TaxRegime.LUCRO_PRESUMIDO]: {
            icms:
              config.regime === TaxRegime.LUCRO_PRESUMIDO
                ? config.icmsRate
                : DEFAULT_RATES[TaxRegime.LUCRO_PRESUMIDO].icms,
            pis:
              config.regime === TaxRegime.LUCRO_PRESUMIDO
                ? config.pisRate
                : DEFAULT_RATES[TaxRegime.LUCRO_PRESUMIDO].pis,
            cofins:
              config.regime === TaxRegime.LUCRO_PRESUMIDO
                ? config.cofinsRate
                : DEFAULT_RATES[TaxRegime.LUCRO_PRESUMIDO].cofins,
          },
        });
        setIsTaxConfigLoaded(true);
      })
      .catch(() => setIsTaxConfigLoaded(false));
  }, []);

  useEffect(() => {
    const raw = sessionStorage.getItem("invoiceAppointment");
    if (!raw) return;

    try {
      const payload = JSON.parse(raw) as InvoiceAppointmentPayload;
      const totalFromItems = Array.isArray(payload.appointment?.items)
        ? payload.appointment.items.reduce(
            (sum, item) => sum + Number(item.totalPrice ?? item.unitPrice ?? 0),
            0
          )
        : 0;
      const totalFromAppointment = Number(payload.appointment?.totalPrice ?? 0);
      const totalFromServices = Array.isArray(payload.services)
        ? payload.services.reduce((sum, service) => sum + Number(service.price ?? 0), 0)
        : 0;
      const totalFromService = Number(payload.service?.price ?? 0);
      const initialValue =
        totalFromItems > 0
          ? totalFromItems
          : totalFromAppointment > 0
            ? totalFromAppointment
            : totalFromServices > 0
              ? totalFromServices
              : totalFromService;
      const document = payload.client?.document || payload.client?.cpfCnpj || "";

      if (initialValue > 0) {
        setServiceValue(initialValue);
      }
      if (document) {
        setCustomerDocument(document);
      }
      setLoadedFromAppointment(initialValue > 0 || !!document);
    } catch {
      setLoadedFromAppointment(false);
    }
  }, []);

  useEffect(() => {
    if (serviceValue > 0) {
      const calc = calculateTaxes(serviceValue, regime, rates[regime]);
      setCalculation(calc);
      return;
    }

    setCalculation(undefined);
  }, [serviceValue, regime, rates]);

  const handleCalculate = () => {
    if (serviceValue > 0) {
      const calc = calculateTaxes(serviceValue, regime, rates[regime]);
      setCalculation(calc);
    }
  };

  const handleServiceValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setServiceValue(value);
  };

  const getRegimeLabel = (value: TaxRegime) =>
    value === TaxRegime.SIMPLES_NACIONAL ? "Simples Nacional" : "Lucro Presumido";

  return (
    <MainLayout title="">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pre-visualizacao de Nota Fiscal</h1>
          <p className="text-muted-foreground mt-2">
            Visualize o calculo detalhado dos impostos antes de emitir a nota fiscal
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Dados para Calculo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadedFromAppointment ? (
                  <p className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
                    Dados iniciais carregados do agendamento selecionado na agenda.
                  </p>
                ) : null}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serviceValue">Valor do Servico (R$) *</Label>
                    <Input
                      id="serviceValue"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0,00"
                      value={serviceValue || ""}
                      onChange={handleServiceValueChange}
                    />
                    {serviceValue > 0 && (
                      <p className="text-sm text-muted-foreground">{formatCurrency(serviceValue)}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="regime">Regime Tributario</Label>
                    <Select value={regime}>
                      <SelectTrigger disabled>
                        <SelectValue placeholder="Selecione o regime" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={TaxRegime.SIMPLES_NACIONAL}>Simples Nacional</SelectItem>
                        <SelectItem value={TaxRegime.LUCRO_PRESUMIDO}>Lucro Presumido</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Regime definido em{" "}
                      <Link to="/configuracoes?tab=fiscal" className="text-primary hover:underline">
                        Config. Impostos
                      </Link>
                      .
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cfop">CFOP (Codigo Fiscal) *</Label>
                    <Select value={cfop} onValueChange={setCfop}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o CFOP" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CFOP_CODES).map(([code, description]) => (
                          <SelectItem key={code} value={code}>
                            {code} - {description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Codigo Fiscal de Operacoes e Prestacoes</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cst">CST (Situacao Tributaria) *</Label>
                    <Select value={cst} onValueChange={setCst}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o CST" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CST_CODES).map(([code, description]) => (
                          <SelectItem key={code} value={code}>
                            {code} - {description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Codigo de Situacao Tributaria do ICMS</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="customerDocument">CPF/CNPJ do Cliente</Label>
                  <Input
                    id="customerDocument"
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    value={customerDocument}
                    onChange={(e) => setCustomerDocument(e.target.value)}
                  />
                </div>

                <Button onClick={handleCalculate} className="w-full gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Calcular Impostos
                </Button>
              </CardContent>
            </Card>

            <TaxPreview calculation={calculation} regime={getRegimeLabel(regime)} />
          </div>

          <div>
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Validacoes Fiscais</h3>
              <Separator className="mb-4" />
              <FiscalValidation cfop={cfop} cst={cst} customerDocument={customerDocument} />
            </Card>

            <Card className="mt-6 p-6">
              <h3 className="font-semibold mb-4">Aliquotas Aplicadas</h3>
              <Separator className="mb-4" />
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Regime:</span>
                  <span className="font-medium">{getRegimeLabel(regime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ICMS:</span>
                  <span className="font-medium">{rates[regime]?.icms}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">PIS:</span>
                  <span className="font-medium">{rates[regime]?.pis}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">COFINS:</span>
                  <span className="font-medium">{rates[regime]?.cofins}%</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                {isTaxConfigLoaded
                  ? 'Aliquotas carregadas de "Config. Impostos".'
                  : "Usando aliquotas padrao ate carregar a configuracao fiscal."}
              </p>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
