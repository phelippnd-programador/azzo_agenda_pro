'use client';

import { validateCFOP, validateCST } from '@/lib/tax-calculator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface FiscalValidationProps {
  cfop: string;
  cst: string;
  customerDocument: string;
}

export function FiscalValidation({ cfop, cst, customerDocument }: FiscalValidationProps) {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate CFOP
  if (!cfop) {
    errors.push('CFOP é obrigatório');
  } else if (!validateCFOP(cfop)) {
    errors.push('CFOP inválido. Formato esperado: X.XXX (ex: 5.933)');
  }

  // Validate CST
  if (!cst) {
    errors.push('CST é obrigatório');
  } else if (!validateCST(cst)) {
    errors.push('CST inválido. Formato esperado: XX (ex: 00)');
  }

  // Validate customer document
  if (!customerDocument) {
    warnings.push('Documento do cliente não informado');
  } else {
    const cleanDoc = customerDocument.replace(/\D/g, '');
    if (cleanDoc.length !== 11 && cleanDoc.length !== 14) {
      errors.push('CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos');
    }
  }

  if (errors.length === 0 && warnings.length === 0) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Todas as validações fiscais passaram com sucesso!
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-2">
      {errors.map((error, index) => (
        <Alert key={`error-${index}`} variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ))}

      {warnings.map((warning, index) => (
        <Alert key={`warning-${index}`} className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">{warning}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
}