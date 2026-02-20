import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Barcode, Copy, ExternalLink, Receipt } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type BoletoPaymentViewProps = {
  bankSlipUrl?: string | null;
  boletoIdentificationField?: string | null;
  boletoBarCode?: string | null;
  boletoNossoNumero?: string | null;
};

function onlyDigits(value?: string | null) {
  return (value || "").replace(/\D/g, "");
}

function formatBoletoIdentificationField(value?: string | null) {
  const digits = onlyDigits(value);
  if (digits.length === 47) {
    return digits.replace(
      /^(\d{5})(\d{5})(\d{5})(\d{6})(\d{5})(\d{6})(\d)(\d{14})$/,
      "$1.$2 $3.$4 $5.$6 $7 $8"
    );
  }
  if (digits.length === 48) {
    return digits.replace(/(\d{12})(?=\d)/g, "$1 ");
  }
  return value || "-";
}

function formatBoletoBarCode(value?: string | null) {
  const digits = onlyDigits(value);
  if (!digits) return "-";
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatNossoNumero(value?: string | null) {
  const digits = onlyDigits(value);
  if (!digits) return "-";
  if (digits.length > 1) return `${digits.slice(0, -1)}-${digits.slice(-1)}`;
  return digits;
}

export function BoletoPaymentView({
  bankSlipUrl,
  boletoIdentificationField,
  boletoBarCode,
  boletoNossoNumero,
}: BoletoPaymentViewProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  const rawIdentificationField = useMemo(
    () => onlyDigits(boletoIdentificationField),
    [boletoIdentificationField]
  );

  useEffect(() => {
    let mounted = true;
    if (!rawIdentificationField) {
      setQrCodeUrl(null);
      return;
    }

    QRCode.toDataURL(rawIdentificationField, {
      width: 240,
      margin: 1,
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (mounted) setQrCodeUrl(url);
      })
      .catch(() => {
        if (mounted) setQrCodeUrl(null);
      });

    return () => {
      mounted = false;
    };
  }, [rawIdentificationField]);

  const handleCopy = async (value?: string | null, label?: string) => {
    if (!value) {
      toast.error(`${label || "Codigo"} indisponivel.`);
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label || "Codigo"} copiado.`);
    } catch {
      toast.error("Nao foi possivel copiar automaticamente.");
    }
  };

  const formattedLinhaDigitavel = formatBoletoIdentificationField(
    boletoIdentificationField
  );
  const formattedBarCode = formatBoletoBarCode(boletoBarCode);
  const formattedNossoNumero = formatNossoNumero(boletoNossoNumero);

  return (
    <Card className="border-amber-200 bg-amber-50/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-800">
          <Receipt className="h-5 w-5" />
          Pagamento via Boleto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-700">
          Sua assinatura foi criada e aguarda compensacao do boleto.
        </p>

        {qrCodeUrl ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-700">QR Code da linha digitavel</p>
            <img
              src={qrCodeUrl}
              alt="QR Code da linha digitavel do boleto"
              className="mx-auto w-full max-w-60 rounded-lg border bg-white p-2"
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-700">Linha digitavel</p>
          <p className="rounded-md border bg-white p-3 text-xs break-all text-slate-700 font-mono">
            {formattedLinhaDigitavel}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleCopy(rawIdentificationField, "Linha digitavel")}
            className="gap-2"
          >
            <Copy className="h-4 w-4" />
            Copiar linha digitavel
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-700 flex items-center gap-2">
            <Barcode className="h-4 w-4" />
            Codigo de barras
          </p>
          <p className="rounded-md border bg-white p-3 text-xs break-all text-slate-700 font-mono">
            {formattedBarCode}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleCopy(onlyDigits(boletoBarCode), "Codigo de barras")}
            className="gap-2"
          >
            <Copy className="h-4 w-4" />
            Copiar codigo de barras
          </Button>
        </div>

        <div className="space-y-1 text-sm text-slate-700">
          <p>
            <strong>Nosso numero:</strong> {formattedNossoNumero}
          </p>
        </div>

        {bankSlipUrl ? (
          <Button type="button" asChild className="gap-2">
            <a href={bankSlipUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" />
              Abrir boleto
            </a>
          </Button>
        ) : (
          <p className="text-sm text-slate-600">Link do boleto indisponivel no momento.</p>
        )}
      </CardContent>
    </Card>
  );
}
