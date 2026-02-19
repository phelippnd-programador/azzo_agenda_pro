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

// Default tax rates
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

  // Load tax rates from storage
  useEffect(() => {
    fiscalApi
      .getTaxConfig()
      .then((config) => {
        setRegime(config.regime);
        setRates({
          [TaxRegime.SIMPLES_NACIONAL]: {
            icms: config.regime === TaxRegime.SIMPLES_NACIONAL ? config.icmsRate : DEFAULT_RATES[TaxRegime.SIMPLES_NACIONAL].icms,
            pis: config.regime === TaxRegime.SIMPLES_NACIONAL ? config.pisRate : DEFAULT_RATES[TaxRegime.SIMPLES_NACIONAL].pis,
            cofins: config.regime === TaxRegime.SIMPLES_NACIONAL ? config.cofinsRate : DEFAULT_RATES[TaxRegime.SIMPLES_NACIONAL].cofins,
          },
          [TaxRegime.LUCRO_PRESUMIDO]: {
            icms: config.regime === TaxRegime.LUCRO_PRESUMIDO ? config.icmsRate : DEFAULT_RATES[TaxRegime.LUCRO_PRESUMIDO].icms,
            pis: config.regime === TaxRegime.LUCRO_PRESUMIDO ? config.pisRate : DEFAULT_RATES[TaxRegime.LUCRO_PRESUMIDO].pis,
            cofins: config.regime === TaxRegime.LUCRO_PRESUMIDO ? config.cofinsRate : DEFAULT_RATES[TaxRegime.LUCRO_PRESUMIDO].cofins,
          },
        });
        setIsTaxConfigLoaded(true);
      })
      .catch(() => setIsTaxConfigLoaded(false));
  }, []);

  // Recalculate when values change
  useEffect(() => {
    if (serviceValue > 0) {
      const calc = calculateTaxes(serviceValue, regime, rates[regime]);
      setCalculation(calc);
    } else {
      setCalculation(undefined);
    }
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

  const getRegimeLabel = (r: TaxRegime) => {
    return r === TaxRegime.SIMPLES_NACIONAL ? "Simples Nacional" : "Lucro Presumido";
  };

  return (
    <MainLayout title="">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pré-visualização de Nota Fiscal</h1>
          <p className="text-muted-foreground mt-2">
            Visualize o cálculo detalhado dos impostos antes de emitir a nota fiscal
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Input Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Value and Regime */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Dados para Cálculo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serviceValue">Valor do Serviço (R$) *</Label>
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
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(serviceValue)}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="regime">Regime Tributário</Label>
                    <Select value={regime}>
                      <SelectTrigger disabled>
                        <SelectValue placeholder="Selecione o regime" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={TaxRegime.SIMPLES_NACIONAL}>
                          Simples Nacional
                        </SelectItem>
                        <SelectItem value={TaxRegime.LUCRO_PRESUMIDO}>
                          Lucro Presumido
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Regime definido em{" "}
                      <Link to="/config-impostos" className="text-violet-600 hover:underline">
                        Config. Impostos
                      </Link>
                      .
                    </p>
                  </div>
                </div>

                <Separator />

                {/* CFOP and CST */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cfop">CFOP (Código Fiscal) *</Label>
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
                    <p className="text-xs text-muted-foreground">
                      Código Fiscal de Operações e Prestações
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cst">CST (Situação Tributária) *</Label>
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
                    <p className="text-xs text-muted-foreground">
                      Código de Situação Tributária do ICMS
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Customer Document */}
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

            {/* Tax Preview */}
            <TaxPreview calculation={calculation} regime={getRegimeLabel(regime)} />
          </div>

          {/* Validation Panel */}
          <div>
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Validações Fiscais</h3>
              <Separator className="mb-4" />
              <FiscalValidation
                cfop={cfop}
                cst={cst}
                customerDocument={customerDocument}
              />
            </Card>

            {/* Tax Rates Info */}
            <Card className="mt-6 p-6">
              <h3 className="font-semibold mb-4">Alíquotas Aplicadas</h3>
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
                  ? 'Alíquotas carregadas de "Config. Impostos".'
                  : "Usando alíquotas padrão até carregar a configuração fiscal."}
              </p>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
