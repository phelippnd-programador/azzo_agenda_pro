import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  type CookieConsentChoice,
  persistCookieConsent,
  readCookieConsent,
} from "@/lib/cookie-consent";

export function CookieConsentBanner() {
  const [consent, setConsent] = useState<CookieConsentChoice | null>(null);

  useEffect(() => {
    setConsent(readCookieConsent()?.choice ?? null);
  }, []);

  const persistConsent = (value: CookieConsentChoice) => {
    persistCookieConsent(value);
    setConsent(value);
  };

  if (consent) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[80] rounded-xl border bg-card p-4 shadow-lg lg:left-auto lg:max-w-xl">
      <p className="text-sm text-foreground">
        Utilizamos cookies estritamente necessarios para funcionamento e, quando
        aplicavel, cookies nao essenciais com seu consentimento.
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Consulte nossa{" "}
        <Link to="/politica-privacidade" className="underline">
          Politica de Privacidade
        </Link>
        .
      </p>
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={() => persistConsent("accepted")}>
          Aceitar
        </Button>
        <Button size="sm" variant="outline" onClick={() => persistConsent("rejected")}>
          Rejeitar nao essenciais
        </Button>
      </div>
    </div>
  );
}
