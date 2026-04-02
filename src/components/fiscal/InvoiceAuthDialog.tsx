import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type AuthMode = "CREATE_AND_AUTHORIZE" | "AUTHORIZE_EXISTING" | "REPROCESS_AUTHORIZE";

interface InvoiceAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  authMode: AuthMode;
  certificatePassword: string;
  certificatePasswordTouched: boolean;
  isCertificatePasswordValid: boolean;
  isAuthorizing: boolean;
  passwordMinLength: number;
  onPasswordChange: (value: string) => void;
  onPasswordBlur: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export function InvoiceAuthDialog({
  open,
  onOpenChange,
  authMode,
  certificatePassword,
  certificatePasswordTouched,
  isCertificatePasswordValid,
  isAuthorizing,
  passwordMinLength,
  onPasswordChange,
  onPasswordBlur,
  onCancel,
  onConfirm,
}: InvoiceAuthDialogProps) {
  const description =
    authMode === "REPROCESS_AUTHORIZE"
      ? "Informe a senha do certificado digital para reprocessar a autorizacao da nota."
      : authMode === "AUTHORIZE_EXISTING"
      ? "Informe a senha do certificado digital para autorizar o rascunho selecionado."
      : "Informe a senha do certificado digital para concluir a autorizacao da nota.";

  const confirmLabel =
    authMode === "REPROCESS_AUTHORIZE"
      ? "Reprocessar Autorizacao"
      : authMode === "AUTHORIZE_EXISTING"
      ? "Emitir Rascunho"
      : "Autorizar Nota";

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isAuthorizing) onOpenChange(isOpen);
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Autorizar Nota Fiscal</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Input
            type="password"
            placeholder="Senha do certificado"
            value={certificatePassword}
            onChange={(e) => onPasswordChange(e.target.value)}
            onBlur={onPasswordBlur}
            autoFocus
          />
          {certificatePasswordTouched && !isCertificatePasswordValid ? (
            <p className="text-xs text-red-600">
              Informe uma senha com pelo menos {passwordMinLength} caracteres.
            </p>
          ) : null}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isAuthorizing}>
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isAuthorizing || !isCertificatePasswordValid}
          >
            {isAuthorizing ? "Processando..." : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
