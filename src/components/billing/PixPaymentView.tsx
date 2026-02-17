import { Copy, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PixPaymentViewProps = {
  pixQrCodeBase64?: string | null;
  pixPayload?: string | null;
  onCopyPix: () => void;
};

function resolvePixImageSrc(base64?: string | null) {
  if (!base64) return null;
  if (base64.startsWith("data:image")) return base64;
  return `data:image/png;base64,${base64}`;
}

export function PixPaymentView({
  pixQrCodeBase64,
  pixPayload,
  onCopyPix,
}: PixPaymentViewProps) {
  const imageSrc = resolvePixImageSrc(pixQrCodeBase64);

  return (
    <Card className="border-emerald-200 bg-emerald-50/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-emerald-800">
          <QrCode className="h-5 w-5" />
          Pagamento via PIX
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt="QR Code PIX para pagamento da assinatura"
            className="mx-auto w-full max-w-60 rounded-lg border bg-white p-2"
          />
        ) : (
          <p className="text-sm text-slate-600">
            O QR Code nao foi retornado. Use o codigo PIX abaixo.
          </p>
        )}

        {pixPayload ? (
          <>
            <p className="rounded-md border bg-white p-3 text-xs break-all text-slate-700">
              {pixPayload}
            </p>
            <Button type="button" variant="outline" onClick={onCopyPix} className="gap-2">
              <Copy className="h-4 w-4" />
              Copiar codigo PIX
            </Button>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
