import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { LegalDocumentDialog } from "@/components/register/LegalDocumentDialog";
import { publicLegalApi } from "@/lib/api/legal";
import type { LegalDocumentResponse, TermsDocumentType } from "@/types/terms";

type StepTermsProps = {
  onReadComplete: (complete: boolean) => void;
  onLgpdConsent: (consent: boolean) => void;
  onVersionsLoaded: (versions: { termsVersion: string; privacyVersion: string } | null) => void;
  termsRead: boolean;
  lgpdConsent: boolean;
};

export function StepTerms({
  onReadComplete,
  onLgpdConsent,
  onVersionsLoaded,
  termsRead,
  lgpdConsent,
}: StepTermsProps) {
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const [termsOfUseVersion, setTermsOfUseVersion] = useState("");
  const [privacyPolicyVersion, setPrivacyPolicyVersion] = useState("");
  const [versionsError, setVersionsError] = useState(false);

  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [legalType, setLegalType] = useState<TermsDocumentType>("TERMS_OF_USE");
  const [legalDocument, setLegalDocument] = useState<LegalDocumentResponse | null>(null);
  const [isLoadingLegal, setIsLoadingLegal] = useState(false);
  const [legalError, setLegalError] = useState<string | null>(null);

  useEffect(() => {
    const loadLegalVersions = async () => {
      try {
        const legal = await publicLegalApi.getAll();
        const terms = legal.termsOfUse?.version || "";
        const privacy = legal.privacyPolicy?.version || "";
        setTermsOfUseVersion(terms);
        setPrivacyPolicyVersion(privacy);
        setVersionsError(false);
        onVersionsLoaded(terms && privacy ? { termsVersion: terms, privacyVersion: privacy } : null);
      } catch {
        setVersionsError(true);
        onVersionsLoaded(null);
      }
    };
    void loadLegalVersions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (scrolledToEnd) return;
    const el = e.currentTarget;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    if (atBottom) setScrolledToEnd(true);
  };

  const openLegalDialog = async (type: TermsDocumentType) => {
    try {
      setIsLegalOpen(true);
      setIsLoadingLegal(true);
      setLegalError(null);
      setLegalType(type);
      const data =
        type === "PRIVACY_POLICY"
          ? await publicLegalApi.getPrivacyPolicy()
          : await publicLegalApi.getTermsOfUse();
      setLegalDocument(data);
    } catch {
      setLegalError("Nao foi possivel carregar o documento.");
      setLegalDocument(null);
    } finally {
      setIsLoadingLegal(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Bem-vinda ao Azzo Agenda Pro</h2>
        <p className="text-muted-foreground text-sm">
          Em menos de 10 minutos sua agenda estará pronta para o primeiro agendamento.
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">Termos de Uso e Política de Privacidade</p>
        <ScrollArea
          className="h-48 rounded-md border p-4"
          onScrollCapture={handleScroll}
        >
          <div className="space-y-3 text-sm text-muted-foreground pr-2">
            <p>
              Ao utilizar o Azzo Agenda Pro, você concorda com nossos Termos de Uso e Política de Privacidade. Leia atentamente as condições abaixo antes de prosseguir.
            </p>
            <p>
              <strong>1. Uso do serviço</strong><br />
              O Azzo Agenda Pro é uma plataforma de gestão de agendamentos para profissionais de beleza e estética. O acesso ao sistema é pessoal e intransferível.
            </p>
            <p>
              <strong>2. Dados pessoais</strong><br />
              Para a prestação dos serviços, coletamos e processamos dados pessoais de você e de seus clientes, conforme a Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018).
            </p>
            <p>
              <strong>3. Responsabilidade dos dados</strong><br />
              Você, como titular do estabelecimento, é o controlador dos dados pessoais dos seus clientes inseridos no sistema. O Azzo Agenda Pro atua como operador dessas informações.
            </p>
            <p>
              <strong>4. Segurança</strong><br />
              Empregamos medidas técnicas e organizacionais adequadas para proteger os dados contra acesso não autorizado, perda ou destruição.
            </p>
            <p>
              <strong>5. Cancelamento</strong><br />
              Você pode cancelar o uso do serviço a qualquer momento. Após o cancelamento, seus dados serão mantidos por 90 dias e então excluídos permanentemente.
            </p>
            <p>
              Este é um resumo. Para ler a versão completa e vigente, use os links abaixo.
            </p>
          </div>
        </ScrollArea>

        {!scrolledToEnd && (
          <p className="text-xs text-muted-foreground">
            Role até o final para habilitar a confirmação.
          </p>
        )}
        {versionsError && (
          <p className="text-xs text-destructive">
            Não foi possível carregar a versão vigente dos termos. Recarregue a página antes de continuar.
          </p>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="terms-accept"
            checked={termsRead}
            disabled={!scrolledToEnd || !termsOfUseVersion || !privacyPolicyVersion}
            onCheckedChange={(checked) => onReadComplete(Boolean(checked))}
          />
          <Label
            htmlFor="terms-accept"
            className={`text-sm leading-relaxed cursor-pointer ${!scrolledToEnd ? "text-muted-foreground" : ""}`}
          >
            Li e aceito os{" "}
            <button
              type="button"
              onClick={() => void openLegalDialog("TERMS_OF_USE")}
              className="text-primary underline"
            >
              Termos de Uso{termsOfUseVersion ? ` (v${termsOfUseVersion})` : ""}
            </button>{" "}
            e a{" "}
            <button
              type="button"
              onClick={() => void openLegalDialog("PRIVACY_POLICY")}
              className="text-primary underline"
            >
              Política de Privacidade{privacyPolicyVersion ? ` (v${privacyPolicyVersion})` : ""}
            </button>
          </Label>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id="lgpd-consent"
            checked={lgpdConsent}
            onCheckedChange={(checked) => onLgpdConsent(Boolean(checked))}
          />
          <Label htmlFor="lgpd-consent" className="text-sm leading-relaxed cursor-pointer">
            Entendo que sou responsável pelos dados dos meus clientes como controlador (LGPD)
          </Label>
        </div>
      </div>

      <LegalDocumentDialog
        open={isLegalOpen}
        onOpenChange={setIsLegalOpen}
        legalType={legalType}
        legalDocument={legalDocument}
        isLoadingLegal={isLoadingLegal}
        legalError={legalError}
      />
    </div>
  );
}
