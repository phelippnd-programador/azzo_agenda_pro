import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { nfseApi } from "@/lib/api";

export interface NfseAuthorizePayload {
  certificatePassword: string;
  /** Ausente quando nao ha provedores alternativos: o backend mantém o do rascunho. */
  provedor?: string;
}

interface NfseAuthorizeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Município do documento — origem da lista de provedores disponíveis. */
  municipioCodigoIbge?: string;
  /** Provedor atual do rascunho (pré-seleção quando disponível na lista). */
  currentProvedor?: string;
  isAuthorizing: boolean;
  /** Erro da tentativa anterior (senha inválida etc.) — exibido sem fechar o diálogo. */
  errorMessage?: string | null;
  onConfirm: (payload: NfseAuthorizePayload) => void;
}

/**
 * Confirmação de emissão de NFS-e: senha do certificado (obrigatória para
 * assinar o XML — nunca armazenada, enviada só na requisição) e escolha do
 * provedor entre os disponíveis para a empresa no município do documento.
 * Um único provedor é selecionado automaticamente; mais de um exige escolha.
 */
export function NfseAuthorizeDialog({
  open,
  onOpenChange,
  municipioCodigoIbge,
  currentProvedor,
  isAuthorizing,
  errorMessage,
  onConfirm,
}: NfseAuthorizeDialogProps) {
  const [password, setPassword] = useState("");
  const [providers, setProviders] = useState<string[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  const [selectedProvedor, setSelectedProvedor] = useState<string>("");

  useEffect(() => {
    if (!open) {
      // Nao reter a senha fora do ciclo de emissao.
      setPassword("");
      return;
    }
    let mounted = true;
    setIsLoadingProviders(true);
    nfseApi
      .listProviderCapabilities(
        municipioCodigoIbge ? { municipioCodigoIbge } : undefined
      )
      .then((capabilities) => {
        if (!mounted) return;
        const unique = [...new Set(capabilities.map((c) => c.provedor))];
        setProviders(unique);
        if (unique.length === 1) {
          setSelectedProvedor(unique[0]);
        } else if (currentProvedor && unique.includes(currentProvedor)) {
          setSelectedProvedor(currentProvedor);
        } else {
          setSelectedProvedor("");
        }
      })
      .catch(() => {
        if (!mounted) return;
        // Sem lista: mantém o provedor do rascunho (comportamento atual do backend).
        setProviders([]);
        setSelectedProvedor("");
      })
      .finally(() => {
        if (mounted) setIsLoadingProviders(false);
      });
    return () => {
      mounted = false;
    };
  }, [open, municipioCodigoIbge, currentProvedor]);

  const providerChoiceRequired = providers.length > 1;
  const canConfirm = useMemo(() => {
    if (isAuthorizing || isLoadingProviders) return false;
    if (!password.trim()) return false;
    if (providerChoiceRequired && !selectedProvedor) return false;
    return true;
  }, [isAuthorizing, isLoadingProviders, password, providerChoiceRequired, selectedProvedor]);

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm({
      certificatePassword: password.trim(),
      provedor: selectedProvedor || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isAuthorizing && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Emitir NFS-e</DialogTitle>
          <DialogDescription>
            Confirme o provedor e informe a senha do certificado digital para assinar e enviar a
            nota para autorizacao.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nfse-auth-provedor">Provedor da prefeitura</Label>
            {isLoadingProviders ? (
              <p className="text-sm text-muted-foreground">Carregando provedores...</p>
            ) : providers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {currentProvedor
                  ? `Sera utilizado o provedor ${currentProvedor}.`
                  : "Sera utilizado o provedor configurado para o municipio."}
              </p>
            ) : (
              <>
                <Select
                  value={selectedProvedor || undefined}
                  onValueChange={setSelectedProvedor}
                  disabled={providers.length === 1 || isAuthorizing}
                >
                  <SelectTrigger id="nfse-auth-provedor">
                    <SelectValue placeholder="Selecione o provedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((provedor) => (
                      <SelectItem key={provedor} value={provedor}>
                        {provedor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {providerChoiceRequired ? (
                  <p className="text-xs text-muted-foreground">
                    Mais de um provedor disponivel para este municipio — escolha qual utilizar.
                  </p>
                ) : null}
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nfse-auth-password">Senha do certificado</Label>
            <Input
              id="nfse-auth-password"
              type="password"
              autoComplete="off"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirm();
              }}
              disabled={isAuthorizing}
            />
            <p className="text-xs text-muted-foreground">
              A senha e usada apenas nesta emissao e nao fica armazenada.
            </p>
          </div>

          {errorMessage ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Nao foi possivel emitir</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isAuthorizing}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!canConfirm}>
            {isAuthorizing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Emitindo...
              </>
            ) : (
              "Emitir NFS-e"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
