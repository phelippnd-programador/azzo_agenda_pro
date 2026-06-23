import { useRef, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";

type StepTermsProps = {
  onReadComplete: (complete: boolean) => void;
  onLgpdConsent: (consent: boolean) => void;
  termsRead: boolean;
  lgpdConsent: boolean;
};

export function StepTerms({
  onReadComplete,
  onLgpdConsent,
  termsRead,
  lgpdConsent,
}: StepTermsProps) {
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (scrolledToEnd) return;
    const el = e.currentTarget;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    if (atBottom) setScrolledToEnd(true);
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
          <div ref={scrollRef} className="space-y-3 text-sm text-muted-foreground pr-2">
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
              Para ler a versão completa dos nossos termos, acesse{" "}
              <a
                href="/termos-de-uso"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                /termos-de-uso
              </a>.
            </p>
          </div>
        </ScrollArea>

        {!scrolledToEnd && (
          <p className="text-xs text-muted-foreground">
            Role até o final para habilitar a confirmação.
          </p>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="terms-accept"
            checked={termsRead}
            disabled={!scrolledToEnd}
            onCheckedChange={(checked) => onReadComplete(Boolean(checked))}
          />
          <Label
            htmlFor="terms-accept"
            className={`text-sm leading-relaxed cursor-pointer ${!scrolledToEnd ? "text-muted-foreground" : ""}`}
          >
            Li e aceito os{" "}
            <a href="/termos-de-uso" target="_blank" rel="noopener noreferrer" className="text-primary underline">
              Termos de Uso
            </a>{" "}
            e a{" "}
            <a href="/politica-privacidade" target="_blank" rel="noopener noreferrer" className="text-primary underline">
              Política de Privacidade
            </a>
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
    </div>
  );
}
