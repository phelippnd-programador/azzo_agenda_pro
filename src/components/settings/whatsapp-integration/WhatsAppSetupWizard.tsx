import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Loader2,
  Send,
  ShieldCheck,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type {
  WhatsAppTestMessageResponse,
  WhatsAppValidateConnectionResponse,
} from "@/types/whatsapp";
import {
  META_BUSINESS_HOME_URL,
  META_BUSINESS_SETTINGS_URL,
  META_GRAPH_EXPLORER_URL,
  META_SYSTEM_USERS_URL,
  META_WHATSAPP_MANAGER_URL,
  MetaLinkButton,
  resolveStepStatus,
  WIZARD_STEPS,
} from "@/components/settings/whatsapp-integration/shared";

type WhatsAppSetupWizardProps = {
  currentStep: number;
  onboardingStatus: string;
  webhookVerifyToken: string;
  businessAccountId: string;
  businessId: string;
  phoneNumberId: string;
  displayPhoneNumber: string;
  manualAccessToken: string;
  isTokenConfigured: boolean;
  webhookUrl: string;
  webhookNeedsPublicUrl: boolean;
  canAdvanceStep: boolean;
  isSaving: boolean;
  isTesting: boolean;
  isValidatingConnection: boolean;
  isSendingTestMessage: boolean;
  validationResult: WhatsAppValidateConnectionResponse | null;
  testResult: string;
  testDestinationPhone: string;
  testMessageBody: string;
  testMessageResult: WhatsAppTestMessageResponse | null;
  onBusinessAccountIdChange: (value: string) => void;
  onBusinessIdChange: (value: string) => void;
  onPhoneNumberIdChange: (value: string) => void;
  onDisplayPhoneNumberChange: (value: string) => void;
  onManualAccessTokenChange: (value: string) => void;
  onWebhookVerifyTokenChange: (value: string) => void;
  onTestDestinationPhoneChange: (value: string) => void;
  onTestMessageBodyChange: (value: string) => void;
  onCopy: (value: string, successMessage: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  onValidateConnection: () => void;
  onSave: () => void;
  onTest: () => void;
  onSendTestMessage: () => void;
};

export function WhatsAppSetupWizard({
  currentStep,
  onboardingStatus,
  webhookVerifyToken,
  businessAccountId,
  businessId,
  phoneNumberId,
  displayPhoneNumber,
  manualAccessToken,
  isTokenConfigured,
  webhookUrl,
  webhookNeedsPublicUrl,
  canAdvanceStep,
  isSaving,
  isTesting,
  isValidatingConnection,
  isSendingTestMessage,
  validationResult,
  testResult,
  testDestinationPhone,
  testMessageBody,
  testMessageResult,
  onBusinessAccountIdChange,
  onBusinessIdChange,
  onPhoneNumberIdChange,
  onDisplayPhoneNumberChange,
  onManualAccessTokenChange,
  onWebhookVerifyTokenChange,
  onTestDestinationPhoneChange,
  onTestMessageBodyChange,
  onCopy,
  onPrevious,
  onNext,
  onValidateConnection,
  onSave,
  onTest,
  onSendTestMessage,
}: WhatsAppSetupWizardProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-2 sm:gap-4">
        {WIZARD_STEPS.map((step, index) => {
          const stepNumber = index + 1;
          const stepStatus = resolveStepStatus(currentStep, stepNumber);
          return (
            <div key={step} className="flex items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  stepStatus === "done"
                    ? "bg-primary text-primary-foreground"
                    : stepStatus === "current"
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {stepStatus === "done" ? <Check className="h-4 w-4" /> : stepNumber}
              </div>
              {stepNumber < WIZARD_STEPS.length && (
                <div
                  className={`mx-2 h-1 w-6 rounded sm:w-10 ${
                    currentStep > stepNumber ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      <Card className="border-dashed bg-muted/20">
        <CardHeader>
          <CardTitle className="text-base">
            Etapa {currentStep} de {WIZARD_STEPS.length}: {WIZARD_STEPS[currentStep - 1]}
          </CardTitle>
          <CardDescription>
            Fluxo guiado para conectar o WhatsApp Cloud API do tenant sem Embedded Signup.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentStep === 1 ? (
            <>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Antes de iniciar</AlertTitle>
                <AlertDescription>
                  Antes de configurar no AZZO, confirme que o cliente tem acesso de administrador ao portifolio da empresa na Meta, ao WhatsApp Business Account e ao numero que sera conectado.
                </AlertDescription>
              </Alert>
              <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                Checklist minimo:
                <ol className="mt-2 list-decimal space-y-1 pl-4">
                  <li>Entrar com o Facebook que administra a empresa do cliente.</li>
                  <li>Selecionar o business portfolio correto no topo da Meta Business Suite.</li>
                  <li>Ter acesso a `Accounts &gt; WhatsApp Accounts`.</li>
                  <li>Ter acesso a `Users &gt; System Users` para gerar o token.</li>
                  <li>Ter o numero disponivel para verificacao por SMS ou voz, se ainda nao estiver vinculado.</li>
                </ol>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <p className="text-sm font-medium">Webhook Verify Token</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {webhookVerifyToken || "Sera gerado automaticamente ao salvar."}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-sm font-medium">Status atual</p>
                  <p className="mt-1 text-xs text-muted-foreground">{onboardingStatus}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <MetaLinkButton href={META_BUSINESS_HOME_URL}>
                  Abrir Business Manager
                </MetaLinkButton>
                <MetaLinkButton href={META_BUSINESS_SETTINGS_URL}>
                  Abrir configuracoes da empresa
                </MetaLinkButton>
              </div>
            </>
          ) : null}

          {currentStep === 2 ? (
            <>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Acesso ao Business Manager</AlertTitle>
                <AlertDescription>
                  Use esta etapa para localizar o portfolio correto da empresa e abrir a area onde o WhatsApp Business Account sera criado ou administrado.
                </AlertDescription>
              </Alert>
              <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                Caminho esperado: Business Manager → Accounts → WhatsApp Accounts.
                <ol className="mt-2 list-decimal space-y-1 pl-4">
                  <li>Clique em `Abrir Business Manager`.</li>
                  <li>Escolha a empresa correta no seletor de portfolio.</li>
                  <li>Abra `Accounts` e depois `WhatsApp Accounts`.</li>
                  <li>Se ja existir uma conta do WhatsApp para o cliente, selecione essa conta.</li>
                  <li>Se nao existir, avance para criar uma nova conta na etapa seguinte.</li>
                </ol>
              </div>
              <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                Dado que o cliente precisa confirmar aqui: ele esta no business portfolio certo. Se entrar na empresa errada, todos os IDs copiados nas proximas etapas ficarao incorretos.
              </div>
              <div className="flex flex-wrap gap-2">
                <MetaLinkButton href={META_BUSINESS_HOME_URL}>
                  Entrar no Business Manager
                </MetaLinkButton>
                <MetaLinkButton href={META_BUSINESS_SETTINGS_URL}>
                  Abrir Business Settings
                </MetaLinkButton>
              </div>
            </>
          ) : null}

          {currentStep === 3 ? (
            <>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Criacao do WABA</AlertTitle>
                <AlertDescription>
                  Crie ou abra o WhatsApp Business Account do cliente. E nessa tela que voce vai chegar aos dados tecnicos usados pelo AZZO.
                </AlertDescription>
              </Alert>
              <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                O que fazer no Facebook:
                <ol className="mt-2 list-decimal space-y-1 pl-4">
                  <li>Clique em `Abrir WhatsApp Manager`.</li>
                  <li>Selecione ou crie a conta do WhatsApp Business da empresa.</li>
                  <li>Confirme que o numero esta vinculado a essa conta.</li>
                  <li>Anote o `WABA ID` da conta.</li>
                  <li>Anote tambem o `Business ID` da empresa, se estiver visivel na tela de configuracoes.</li>
                </ol>
              </div>
              <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                O `WABA ID` e o identificador da conta do WhatsApp Business. No AZZO ele entra no campo `WABA / Business Account ID`.
              </div>
              <div className="flex flex-wrap gap-2">
                <MetaLinkButton href={META_WHATSAPP_MANAGER_URL}>
                  Abrir WhatsApp Manager
                </MetaLinkButton>
                <MetaLinkButton href={META_BUSINESS_SETTINGS_URL}>
                  Abrir Business Settings
                </MetaLinkButton>
              </div>
            </>
          ) : null}

          {currentStep === 4 ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <MetaLinkButton href={META_WHATSAPP_MANAGER_URL}>
                  Abrir numeros no WhatsApp Manager
                </MetaLinkButton>
                <MetaLinkButton href={META_BUSINESS_SETTINGS_URL}>
                  Abrir configuracoes da empresa
                </MetaLinkButton>
              </div>
              <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                O que copiar no Facebook e colar no AZZO:
                <ol className="mt-2 list-decimal space-y-1 pl-4">
                  <li>`WABA / Business Account ID`: ID da conta do WhatsApp Business.</li>
                  <li>`Business ID`: ID do portfolio/empresa na Meta.</li>
                  <li>`Phone Number ID`: ID tecnico do numero conectado na Cloud API.</li>
                  <li>`Numero exibido`: numero mostrado ao usuario final, se a Meta exibir esse campo.</li>
                </ol>
              </div>
              <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                No WhatsApp Manager, entre no numero e procure pela area de detalhes/API do numero. O valor mais importante aqui e o `Phone Number ID`, porque e ele que o backend usa para validar e enviar mensagens.
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="whatsapp-manual-business-account-id">
                    WABA / Business Account ID
                  </label>
                  <Input
                    id="whatsapp-manual-business-account-id"
                    value={businessAccountId}
                    placeholder="Ex.: 1943140936275518"
                    onChange={(event) => onBusinessAccountIdChange(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="whatsapp-manual-business-id">
                    Business ID
                  </label>
                  <Input
                    id="whatsapp-manual-business-id"
                    value={businessId}
                    placeholder="Opcional, mas recomendado"
                    onChange={(event) => onBusinessIdChange(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="whatsapp-manual-phone-number-id">
                    Phone Number ID
                  </label>
                  <Input
                    id="whatsapp-manual-phone-number-id"
                    value={phoneNumberId}
                    placeholder="Ex.: 1043083748882407"
                    onChange={(event) => onPhoneNumberIdChange(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="whatsapp-manual-display-phone-number">
                    Numero exibido
                  </label>
                  <Input
                    id="whatsapp-manual-display-phone-number"
                    value={displayPhoneNumber}
                    placeholder="Opcional. Ex.: +55 11 99999-9999"
                    onChange={(event) => onDisplayPhoneNumberChange(event.target.value)}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {currentStep === 5 ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <MetaLinkButton href={META_SYSTEM_USERS_URL}>
                  Abrir usuarios de sistema
                </MetaLinkButton>
                <MetaLinkButton href={META_GRAPH_EXPLORER_URL}>
                  Abrir Graph API Explorer
                </MetaLinkButton>
              </div>
              <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                Como gerar o token:
                <ol className="mt-2 list-decimal space-y-1 pl-4">
                  <li>Abra `Usuarios de sistema`.</li>
                  <li>Crie ou selecione um system user com permissao administrativa.</li>
                  <li>Conceda acesso ao app e aos ativos do WhatsApp da empresa.</li>
                  <li>Gere um `Access Token` com as permissoes `business_management`, `whatsapp_business_management` e `whatsapp_business_messaging`.</li>
                  <li>Cole esse token no campo `Access Token` do AZZO.</li>
                </ol>
              </div>
              <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                O `Webhook Verify Token` pode ficar em branco. Se voce nao preencher, o AZZO gera automaticamente ao salvar e mostra o valor para configuracao do webhook depois.
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium" htmlFor="whatsapp-manual-access-token">
                    Access Token
                  </label>
                  <Input
                    id="whatsapp-manual-access-token"
                    type="password"
                    autoComplete="off"
                    value={manualAccessToken}
                    placeholder={
                      isTokenConfigured
                        ? "Ja configurado no backend. Preencha apenas para substituir."
                        : "Cole o access token do WhatsApp Cloud API"
                    }
                    onChange={(event) => onManualAccessTokenChange(event.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Token configurado no backend: {isTokenConfigured ? "Sim" : "Nao"}.
                  </p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-medium" htmlFor="whatsapp-manual-webhook-token">
                      Webhook Verify Token
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onCopy(webhookVerifyToken, "Webhook verify token copiado.")}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar
                    </Button>
                  </div>
                  <Input
                    id="whatsapp-manual-webhook-token"
                    value={webhookVerifyToken}
                    placeholder="Gerado automaticamente se ficar em branco"
                    onChange={(event) => onWebhookVerifyTokenChange(event.target.value)}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {currentStep === 6 ? (
            <div className="space-y-4">
              <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                Agora o cliente precisa cadastrar o webhook da AZZO na Meta para que mensagens e status de entrega cheguem ao sistema.
                <ol className="mt-2 list-decimal space-y-1 pl-4">
                  <li>Abra o app da Meta e va para a configuracao de webhook do WhatsApp.</li>
                  <li>No campo `Callback URL`, cole a URL abaixo.</li>
                  <li>No campo `Verify Token`, cole o token abaixo.</li>
                  <li>Clique em verificar/salvar na Meta.</li>
                  <li>Depois, assine ao menos o objeto `messages` ou o conjunto de campos de mensagens/status usado no app.</li>
                </ol>
              </div>
              <div className="flex flex-wrap gap-2">
                <MetaLinkButton href={META_BUSINESS_SETTINGS_URL}>
                  Abrir configuracoes da empresa
                </MetaLinkButton>
                <MetaLinkButton href={META_WHATSAPP_MANAGER_URL}>
                  Abrir WhatsApp Manager
                </MetaLinkButton>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-medium">Callback URL</label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onCopy(webhookUrl, "URL do webhook copiada.")}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar
                    </Button>
                  </div>
                  <Input value={webhookUrl} readOnly />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-medium">Verify Token</label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onCopy(webhookVerifyToken, "Verify token do webhook copiado.")}
                      disabled={!webhookVerifyToken}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar
                    </Button>
                  </div>
                  <Input
                    value={webhookVerifyToken}
                    readOnly
                    placeholder="Preencha ou gere o verify token na etapa anterior."
                  />
                </div>
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Importante sobre o verify token</AlertTitle>
                <AlertDescription>
                  Se esse campo estiver vazio, volte para a etapa anterior e preencha manualmente o `Webhook Verify Token`, ou salve a configuracao para o AZZO gerar um token automaticamente e depois retorne a esta etapa.
                </AlertDescription>
              </Alert>
              <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                Depois que a Meta validar a URL, assine os campos do webhook:
                <ol className="mt-2 list-decimal space-y-1 pl-4">
                  <li>`messages`: obrigatorio para receber mensagens inbound e status de entrega/leitura.</li>
                  <li>`message_template_status_update`: opcional, recomendado se o tenant usar templates.</li>
                </ol>
              </div>
              <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                Checklist final dentro da Meta:
                <ol className="mt-2 list-decimal space-y-1 pl-4">
                  <li>Salvar o callback.</li>
                  <li>Confirmar que a verificacao retornou sucesso.</li>
                  <li>Marcar o campo `messages` na assinatura do webhook.</li>
                  <li>Salvar a inscricao do webhook no app.</li>
                </ol>
              </div>
              {webhookNeedsPublicUrl ? (
                <Alert className="border-amber-200 bg-amber-50 text-amber-900">
                  <AlertCircle className="h-4 w-4 !text-amber-700" />
                  <AlertTitle>URL local nao funciona na Meta</AlertTitle>
                  <AlertDescription>
                    A URL atual do webhook parece local (`localhost` ou `127.0.0.1`). Para a Meta validar e entregar eventos, use uma URL publica HTTPS do backend.
                  </AlertDescription>
                </Alert>
              ) : null}
            </div>
          ) : null}

          {currentStep === 7 ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onValidateConnection}
                  disabled={isValidatingConnection || isSaving}
                >
                  {isValidatingConnection ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="mr-2 h-4 w-4" />
                  )}
                  Validar com a Meta
                </Button>
                <Button
                  type="button"
                  onClick={onSave}
                  disabled={isSaving || isTesting || isValidatingConnection}
                >
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Salvar Configuracao
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onTest}
                  disabled={isTesting || isSaving}
                >
                  {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Testar Conexao Salva
                </Button>
              </div>

              {validationResult ? (
                <Alert className="border-green-200 bg-green-50 text-green-900">
                  <CheckCircle2 className="h-4 w-4 !text-green-700" />
                  <AlertTitle>Validacao concluida</AlertTitle>
                  <AlertDescription>
                    {validationResult.message}
                    {validationResult.displayPhoneNumber
                      ? ` Numero exibido: ${validationResult.displayPhoneNumber}.`
                      : ""}
                    {validationResult.verifiedName
                      ? ` Nome verificado: ${validationResult.verifiedName}.`
                      : ""}
                  </AlertDescription>
                </Alert>
              ) : null}

              {testResult ? (
                <Alert className="border-blue-200 bg-blue-50 text-blue-900">
                  <CheckCircle2 className="h-4 w-4 !text-blue-700" />
                  <AlertTitle>Resultado do teste de conexao</AlertTitle>
                  <AlertDescription>{testResult}</AlertDescription>
                </Alert>
              ) : null}

              <div className="space-y-3 rounded-lg border p-3">
                <p className="text-sm font-medium">Enviar mensagem de teste</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="whatsapp-test-destination-phone">
                      Telefone de destino
                    </label>
                    <Input
                      id="whatsapp-test-destination-phone"
                      value={testDestinationPhone}
                      placeholder="Ex.: 5511988887777"
                      onChange={(event) => onTestDestinationPhoneChange(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="whatsapp-test-message">
                      Mensagem
                    </label>
                    <Input
                      id="whatsapp-test-message"
                      value={testMessageBody}
                      placeholder="Mensagem de teste do AZZO Agenda Pro."
                      onChange={(event) => onTestMessageBodyChange(event.target.value)}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onSendTestMessage}
                  disabled={isSendingTestMessage || isSaving}
                >
                  {isSendingTestMessage ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Enviar mensagem de teste
                </Button>
                {testMessageResult ? (
                  <Alert
                    className={
                      testMessageResult.success
                        ? "border-green-200 bg-green-50 text-green-900"
                        : "border-red-200 bg-red-50 text-red-900"
                    }
                  >
                    <CheckCircle2 className={`h-4 w-4 ${testMessageResult.success ? "!text-green-700" : "!text-red-700"}`} />
                    <AlertTitle>Resultado do envio</AlertTitle>
                    <AlertDescription>
                      {testMessageResult.message}
                      {testMessageResult.providerMessageId
                        ? ` Provider message id: ${testMessageResult.providerMessageId}`
                        : ""}
                    </AlertDescription>
                  </Alert>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={onPrevious}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Button
              type="button"
              onClick={onNext}
              disabled={currentStep === WIZARD_STEPS.length || !canAdvanceStep}
            >
              Proxima etapa
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
