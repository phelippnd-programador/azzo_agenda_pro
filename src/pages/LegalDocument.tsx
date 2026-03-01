import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Scissors } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { publicLegalApi } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import type {
  LegalDocumentResponse,
  LgpdContactResponse,
  TermsDocumentType,
} from "@/types/terms";

type LegalDocumentProps = {
  documentType: TermsDocumentType;
  fallbackTitle: string;
};

export default function LegalDocument({ documentType, fallbackTitle }: LegalDocumentProps) {
  const [document, setDocument] = useState<LegalDocumentResponse | null>(null);
  const [lgpdContact, setLgpdContact] = useState<LgpdContactResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDocument = async () => {
      try {
        setIsLoading(true);
        const data =
          documentType === "PRIVACY_POLICY"
            ? await publicLegalApi.getPrivacyPolicy()
            : await publicLegalApi.getTermsOfUse();
        setDocument(data);
        const contact = await publicLegalApi.getContact().catch(() => null);
        setLgpdContact(contact);
        setError(null);
      } catch (err) {
        const uiError = resolveUiError(err, `Erro ao carregar ${fallbackTitle.toLowerCase()}.`);
        setError(uiError.message);
      } finally {
        setIsLoading(false);
      }
    };
    void loadDocument();
  }, [documentType, fallbackTitle]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-card p-4">
      <div className="mx-auto max-w-3xl space-y-4 py-6">
        <div className="flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <Scissors className="w-4 h-4" />
            <span>Voltar para inicio</span>
          </Link>
          <Button variant="outline" asChild>
            <Link to="/login">Voltar</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="rounded-md border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Versao: {document?.version || "-"}</p>
              <p className="text-xs text-muted-foreground">
                Publicado em: {document?.createdAt ? new Date(document.createdAt).toLocaleString("pt-BR") : "-"}
              </p>
            </div>
            {/* <CardTitle>{document?.title || fallbackTitle}</CardTitle> */}
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? <p className="text-sm text-muted-foreground">Carregando documento...</p> : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {!isLoading && !error ? (
              <>
                {lgpdContact?.email || lgpdContact?.channel ? (
                  <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground">Contato LGPD</p>
                    <p>E-mail: {lgpdContact.email || "-"}</p>
                    <p>Canal: {lgpdContact.channel || "-"}</p>
                    <p>SLA: {lgpdContact.responseSla || "-"}</p>
                  </div>
                ) : null}

                <div className="prose prose-sm max-w-none text-foreground">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeSanitize]}
                    components={{
                      h1: ({ ...props }) => <h1 className="text-2xl font-semibold mb-3" {...props} />,
                      h2: ({ ...props }) => <h2 className="text-xl font-semibold mt-6 mb-2" {...props} />,
                      h3: ({ ...props }) => <h3 className="text-lg font-semibold mt-4 mb-2" {...props} />,
                      p: ({ ...props }) => <p className="text-sm leading-6 mb-2" {...props} />,
                      ul: ({ ...props }) => <ul className="list-disc pl-6 space-y-1 mb-3" {...props} />,
                      ol: ({ ...props }) => <ol className="list-decimal pl-6 space-y-1 mb-3" {...props} />,
                      li: ({ ...props }) => <li className="text-sm leading-6" {...props} />,
                      a: ({ ...props }) => (
                        <a
                          className="text-primary underline underline-offset-4 hover:opacity-80"
                          target="_blank"
                          rel="noreferrer"
                          {...props}
                        />
                      ),
                      table: ({ ...props }) => (
                        <div className="overflow-x-auto mb-3">
                          <table className="min-w-full border border-border text-sm" {...props} />
                        </div>
                      ),
                      th: ({ ...props }) => <th className="border border-border bg-muted px-3 py-2 text-left" {...props} />,
                      td: ({ ...props }) => <td className="border border-border px-3 py-2" {...props} />,
                      pre: ({ ...props }) => (
                        <pre className="rounded bg-muted p-3 text-xs overflow-x-auto mb-3" {...props} />
                      ),
                      code: ({ className, ...props }) => {
                        const isBlockCode = typeof className === "string" && className.includes("language-");
                        return (
                          <code
                            className={
                              isBlockCode
                                ? `${className} text-xs`
                                : "rounded bg-muted px-1 py-0.5 text-xs"
                            }
                            {...props}
                          />
                        );
                      },
                    }}
                  >
                    {document?.content || "Documento indisponivel no momento."}
                  </ReactMarkdown>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
