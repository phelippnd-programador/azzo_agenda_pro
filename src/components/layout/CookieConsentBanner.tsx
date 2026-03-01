import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const COOKIE_CONSENT_KEY = "azzo_cookie_consent_v1";

type CookieConsent = "accepted" | "rejected";

const getStoredConsent = (): CookieConsent | null => {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(COOKIE_CONSENT_KEY);
  if (value === "accepted" || value === "rejected") return value;
  return null;
};

export function CookieConsentBanner() {
  const [consent, setConsent] = useState<CookieConsent | null>(null);

  useEffect(() => {
    setConsent(getStoredConsent());
  }, []);

  const persistConsent = (value: CookieConsent) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(COOKIE_CONSENT_KEY, value);
    }
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
