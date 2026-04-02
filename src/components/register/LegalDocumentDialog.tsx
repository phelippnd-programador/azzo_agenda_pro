import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { LegalDocumentResponse, TermsDocumentType } from "@/types/terms";

interface LegalDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  legalType: TermsDocumentType;
  legalDocument: LegalDocumentResponse | null;
  isLoadingLegal: boolean;
  legalError: string | null;
}

export function LegalDocumentDialog({
  open,
  onOpenChange,
  legalType,
  legalDocument,
  isLoadingLegal,
  legalError,
}: LegalDocumentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {legalDocument?.title ||
              (legalType === "PRIVACY_POLICY" ? "Politica de Privacidade" : "Termos de Uso")}
          </DialogTitle>
        </DialogHeader>
        {isLoadingLegal ? (
          <p className="text-sm text-muted-foreground">Carregando documento...</p>
        ) : legalError ? (
          <p className="text-sm text-destructive">{legalError}</p>
        ) : (
          <div className="space-y-3">
            <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
              <p>Versao: {legalDocument?.version || "-"}</p>
              <p>
                Publicado em:{" "}
                {legalDocument?.createdAt
                  ? new Date(legalDocument.createdAt).toLocaleString("pt-BR")
                  : "-"}
              </p>
            </div>
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                {legalDocument?.content || "Documento indisponivel no momento."}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
