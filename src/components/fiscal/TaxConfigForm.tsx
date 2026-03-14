'use client';

import { useState, useEffect } from 'react';
import { TaxRegime } from '@/types/fiscal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ApiError, fiscalApi } from '@/lib/api';
import { maskCnpj, maskPhoneBr, maskCep, onlyDigits } from '@/lib/input-masks';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export function TaxConfigForm() {
  const { toast } = useToast();
  const [regime, setRegime] = useState<TaxRegime>(TaxRegime.SIMPLES_NACIONAL);
  const [icmsRate, setIcmsRate] = useState<string>('');
  const [pisRate, setPisRate] = useState<string>('');
  const [cofinsRate, setCofinsRate] = useState<string>('');
  const [issuerRazaoSocial, setIssuerRazaoSocial] = useState('');
  const [issuerNomeFantasia, setIssuerNomeFantasia] = useState('');
  const [issuerCnpj, setIssuerCnpj] = useState('');
  const [issuerIe, setIssuerIe] = useState('');
  const [issuerIm, setIssuerIm] = useState('');
  const [issuerPhone, setIssuerPhone] = useState('');
  const [issuerEmail, setIssuerEmail] = useState('');
  const [issuerStreet, setIssuerStreet] = useState('');
  const [issuerNumber, setIssuerNumber] = useState('');
  const [issuerComplement, setIssuerComplement] = useState('');
  const [issuerNeighborhood, setIssuerNeighborhood] = useState('');
  const [issuerCity, setIssuerCity] = useState('');
  const [issuerState, setIssuerState] = useState('');
  const [issuerUfCode, setIssuerUfCode] = useState('');
  const [issuerZipCode, setIssuerZipCode] = useState('');
  const [nfceCscHomologation, setNfceCscHomologation] = useState('');
  const [nfceCscIdTokenHomologation, setNfceCscIdTokenHomologation] = useState('');
  const [nfceCscProduction, setNfceCscProduction] = useState('');
  const [nfceCscIdTokenProduction, setNfceCscIdTokenProduction] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUnconfigured, setIsUnconfigured] = useState(false);

  useEffect(() => {
    fiscalApi
      .getTaxConfig()
      .then((config) => {
        setIsUnconfigured(false);
        setRegime(config.regime);
        setIcmsRate(String(config.icmsRate));
        setPisRate(String(config.pisRate));
        setCofinsRate(String(config.cofinsRate));
        setIssuerRazaoSocial(config.issuerRazaoSocial || '');
        setIssuerNomeFantasia(config.issuerNomeFantasia || '');
        setIssuerCnpj(maskCnpj(config.issuerCnpj || ''));
        setIssuerIe(config.issuerIe || '');
        setIssuerIm(config.issuerIm || '');
        setIssuerPhone(maskPhoneBr(config.issuerPhone || ''));
        setIssuerEmail(config.issuerEmail || '');
        setIssuerStreet(config.issuerStreet || '');
        setIssuerNumber(config.issuerNumber || '');
        setIssuerComplement(config.issuerComplement || '');
        setIssuerNeighborhood(config.issuerNeighborhood || '');
        setIssuerCity(config.issuerCity || '');
        setIssuerState((config.issuerState || '').toUpperCase());
        setIssuerUfCode(onlyDigits(config.issuerUfCode || '').slice(0, 2));
        setIssuerZipCode(maskCep(config.issuerZipCode || ''));
        setNfceCscHomologation(config.nfceCscHomologation || '');
        setNfceCscIdTokenHomologation(onlyDigits(config.nfceCscIdTokenHomologation || '').slice(0, 6));
        setNfceCscProduction(config.nfceCscProduction || '');
        setNfceCscIdTokenProduction(onlyDigits(config.nfceCscIdTokenProduction || '').slice(0, 6));
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 404) {
          setIsUnconfigured(true);
        }
        setIcmsRate('2.75');
        setPisRate('0.65');
        setCofinsRate('3.00');
      });
  }, []);

  const handleRegimeChange = (value: string) => {
    const newRegime = value as TaxRegime;
    setRegime(newRegime);

    if (newRegime === TaxRegime.SIMPLES_NACIONAL) {
      setIcmsRate('2.75');
      setPisRate('0.65');
      setCofinsRate('3.00');
    } else {
      setIcmsRate('18.00');
      setPisRate('1.65');
      setCofinsRate('7.60');
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await fiscalApi.updateTaxConfig({
        regime,
        icmsRate: parseFloat(icmsRate),
        pisRate: parseFloat(pisRate),
        cofinsRate: parseFloat(cofinsRate),
        issuerRazaoSocial: issuerRazaoSocial.trim() || undefined,
        issuerNomeFantasia: issuerNomeFantasia.trim() || undefined,
        issuerCnpj: onlyDigits(issuerCnpj),
        issuerIe: issuerIe.trim() || undefined,
        issuerIm: issuerIm.trim() || undefined,
        issuerPhone: onlyDigits(issuerPhone),
        issuerEmail: issuerEmail.trim() || undefined,
        issuerStreet: issuerStreet.trim() || undefined,
        issuerNumber: issuerNumber.trim() || undefined,
        issuerComplement: issuerComplement.trim() || undefined,
        issuerNeighborhood: issuerNeighborhood.trim() || undefined,
        issuerCity: issuerCity.trim() || undefined,
        issuerState: issuerState.trim().toUpperCase() || undefined,
        issuerUfCode: onlyDigits(issuerUfCode),
        issuerZipCode: onlyDigits(issuerZipCode),
        nfceCscHomologation: nfceCscHomologation.trim() || undefined,
        nfceCscIdTokenHomologation: onlyDigits(nfceCscIdTokenHomologation),
        nfceCscProduction: nfceCscProduction.trim() || undefined,
        nfceCscIdTokenProduction: onlyDigits(nfceCscIdTokenProduction),
      });

      toast({
        title: 'Configuracao salva',
        description: 'As aliquotas de impostos foram atualizadas com sucesso.',
      });
      setIsUnconfigured(false);
    } catch {
      toast({
        title: 'Erro ao salvar',
        description: 'Nao foi possivel salvar as aliquotas no servidor.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuracao de Impostos</CardTitle>
        <CardDescription>
          Configure as aliquotas de impostos para emissao de notas fiscais
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isUnconfigured ? (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Configuracao fiscal inicial pendente</AlertTitle>
            <AlertDescription>
              Este tenant ainda nao possui configuracao fiscal cadastrada. Preencha os dados abaixo e salve para
              habilitar o fluxo fiscal.
            </AlertDescription>
          </Alert>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="regime">Regime Tributario</Label>
          <Select value={regime} onValueChange={handleRegimeChange}>
            <SelectTrigger id="regime">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TaxRegime.SIMPLES_NACIONAL}>Simples Nacional</SelectItem>
              <SelectItem value={TaxRegime.LUCRO_PRESUMIDO}>Lucro Presumido</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="icms">Aliquota ICMS (%)</Label>
            <Input
              id="icms"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={icmsRate}
              onChange={(e) => setIcmsRate(e.target.value)}
              placeholder="2.75"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pis">Aliquota PIS (%)</Label>
            <Input
              id="pis"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={pisRate}
              onChange={(e) => setPisRate(e.target.value)}
              placeholder="0.65"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cofins">Aliquota COFINS (%)</Label>
            <Input
              id="cofins"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={cofinsRate}
              onChange={(e) => setCofinsRate(e.target.value)}
              placeholder="3.00"
            />
          </div>
        </div>

        <div className="space-y-3 rounded-lg border p-4">
          <h3 className="font-medium">Emitente (obrigatorio para operacao fiscal real)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Razao Social</Label>
              <Input value={issuerRazaoSocial} onChange={(e) => setIssuerRazaoSocial(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Nome Fantasia</Label>
              <Input value={issuerNomeFantasia} onChange={(e) => setIssuerNomeFantasia(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input value={issuerCnpj} onChange={(e) => setIssuerCnpj(maskCnpj(e.target.value))} placeholder="00.000.000/0000-00" />
            </div>
            <div className="space-y-2">
              <Label>IE</Label>
              <Input value={issuerIe} onChange={(e) => setIssuerIe(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>IM</Label>
              <Input value={issuerIm} onChange={(e) => setIssuerIm(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={issuerPhone} onChange={(e) => setIssuerPhone(maskPhoneBr(e.target.value))} placeholder="(11) 99999-9999" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={issuerEmail} onChange={(e) => setIssuerEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>CEP</Label>
              <Input value={issuerZipCode} onChange={(e) => setIssuerZipCode(maskCep(e.target.value))} placeholder="00000-000" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Logradouro</Label>
              <Input value={issuerStreet} onChange={(e) => setIssuerStreet(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Numero</Label>
              <Input value={issuerNumber} onChange={(e) => setIssuerNumber(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Complemento</Label>
              <Input value={issuerComplement} onChange={(e) => setIssuerComplement(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Bairro</Label>
              <Input value={issuerNeighborhood} onChange={(e) => setIssuerNeighborhood(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input value={issuerCity} onChange={(e) => setIssuerCity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>UF (sigla)</Label>
              <Input value={issuerState} onChange={(e) => setIssuerState(e.target.value.toUpperCase().slice(0, 2))} placeholder="SP" />
            </div>
            <div className="space-y-2">
              <Label>Codigo UF (IBGE)</Label>
              <Input value={issuerUfCode} onChange={(e) => setIssuerUfCode(onlyDigits(e.target.value).slice(0, 2))} placeholder="35" />
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border p-4">
          <h3 className="font-medium">NFC-e CSC / idToken</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>CSC Homologacao</Label>
              <Input value={nfceCscHomologation} onChange={(e) => setNfceCscHomologation(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>idToken Homologacao</Label>
              <Input value={nfceCscIdTokenHomologation} onChange={(e) => setNfceCscIdTokenHomologation(onlyDigits(e.target.value).slice(0, 6))} />
            </div>
            <div className="space-y-2">
              <Label>CSC Producao</Label>
              <Input value={nfceCscProduction} onChange={(e) => setNfceCscProduction(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>idToken Producao</Label>
              <Input value={nfceCscIdTokenProduction} onChange={(e) => setNfceCscIdTokenProduction(onlyDigits(e.target.value).slice(0, 6))} />
            </div>
          </div>
        </div>

        <Button onClick={handleSave} className="w-full" disabled={isSaving}>
          {isSaving ? 'Salvando...' : 'Salvar Configuracao'}
        </Button>
      </CardContent>
    </Card>
  );
}
