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
import { fiscalApi } from '@/lib/api';

export function TaxConfigForm() {
  const { toast } = useToast();
  const [regime, setRegime] = useState<TaxRegime>(TaxRegime.SIMPLES_NACIONAL);
  const [icmsRate, setIcmsRate] = useState<string>('');
  const [pisRate, setPisRate] = useState<string>('');
  const [cofinsRate, setCofinsRate] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fiscalApi
      .getTaxConfig()
      .then((config) => {
        setRegime(config.regime);
        setIcmsRate(String(config.icmsRate));
        setPisRate(String(config.pisRate));
        setCofinsRate(String(config.cofinsRate));
      })
      .catch(() => {
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
      });

      toast({
        title: 'Configuracao salva',
        description: 'As aliquotas de impostos foram atualizadas com sucesso.',
      });
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

        <Button onClick={handleSave} className="w-full" disabled={isSaving}>
          {isSaving ? 'Salvando...' : 'Salvar Configuracao'}
        </Button>
      </CardContent>
    </Card>
  );
}
