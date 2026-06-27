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
    <div className="fixed inset-x-3 bottom-3 z-[80] rounded-2xl border border-border/70 bg-background/95 p-3 shadow-[0_20px_48px_-30px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:bottom-4 sm:left-auto sm:right-4 sm:max-w-[340px]">
      <p className="text-sm font-medium leading-5 text-foreground">
        Cookies e privacidade
      </p>
      <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
        Usamos cookies <strong className="text-foreground">essenciais</strong> para autenticacao e funcionamento da plataforma.
        Com sua permissao, usamos tambem cookies <strong className="text-foreground">nao essenciais</strong> de analytics
        para medir o uso da plataforma.
      </p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        Ao ignorar este aviso, apenas cookies essenciais serao utilizados.{" "}
        <Link
          to="/politica-privacidade"
          className="font-medium text-foreground underline underline-offset-4"
        >
          Politica de Privacidade
        </Link>
        .
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          className="h-8 px-3 text-xs"
          onClick={() => persistConsent("accepted")}
        >
          Aceitar todos
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 px-3 text-xs"
          onClick={() => persistConsent("rejected")}
        >
          Somente essenciais
        </Button>
      </div>
    </div>
  );
}
