import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { CnpjAutoFillField } from "@/components/shared/CnpjAutoFillField";
import { NbsCatalogSearch } from "@/components/nfse/NbsCatalogSearch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { nfseApi, type NfseInvoice } from "@/lib/api";
import { CurrencyInput } from "@/components/ui/currency-input";
import type { CnpjConsultaResponse } from "@/lib/api/cnpj";
import { resolveUiError } from "@/lib/error-utils";
import { toast } from "sonner";

const BASE_ITEM = {
  lineNumber: 1,
  descricaoServico: "",
  quantidade: 1,
  valorUnitario: 0,
  valorTotal: 0,
  itemListaServico: "1.01",
  aliquotaIss: 5,
  valorIss: 0,
};

interface NfseInvoiceFormEmbedProps {
  /** Chamado com o id da NFS-e salva, para que o pai possa navegar para o historico */
  onSaved?: (id: string) => void;
}

export function NfseInvoiceFormEmbed({ onSaved }: NfseInvoiceFormEmbedProps) {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [isEmitting, setIsEmitting] = useState(false);
  const [tomadorAddressPreview, setTomadorAddressPreview] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<Partial<NfseInvoice>>({
    ambiente: "HOMOLOGACAO",
    municipioCodigoIbge: "3304557",
    provedor: "ABRASF",
    numeroRps: 0,
    serieRps: "A1",
    dataCompetencia: new Date().toISOString().slice(0, 10),
    naturezaOperacao: "Prestacao de servico",
    itemListaServico: "1.01",
    valorServicos: 0,
    valorDeducoes: 0,
    valorIss: 0,
    aliquotaIss: 5,
    issRetido: false,
    customer: { type: "CPF", document: "", name: "", email: "", phone: "" },
    items: [BASE_ITEM],
  });

  const showError = (error: unknown, fallbackMessage: string) => {
    const uiError = resolveUiError(error, fallbackMessage);
    toast.error(uiError.code ? `[${uiError.code}] ${uiError.message}` : uiError.message);
  };

  useEffect(() => {
    void (async () => {
      try {
        const cfg = await nfseApi.getConfig("HOMOLOGACAO");
        setInvoice((prev) => ({
          ...prev,
          municipioCodigoIbge: cfg.municipioCodigoIbge || prev.municipioCodigoIbge,
          provedor: cfg.provedor || prev.provedor,
          serieRps: cfg.serieRps || prev.serieRps,
          aliquotaIss: cfg.aliquotaIssPadrao ?? prev.aliquotaIss,
          itemListaServico: cfg.itemListaServicoPadrao || prev.itemListaServico,
          codigoTributacaoMunicipio: cfg.codigoTributacaoMunicipio || prev.codigoTributacaoMunicipio,
          items: [
            {
              ...(prev.items?.[0] || BASE_ITEM),
              itemListaServico: cfg.itemListaServicoPadrao || prev.items?.[0]?.itemListaServico || "1.01",
              aliquotaIss: cfg.aliquotaIssPadrao ?? prev.items?.[0]?.aliquotaIss ?? 5,
            },
          ],
        }));
      } catch {
        // config nao configurada ainda — manter defaults
      }
    })();
  }, []);

  const preview = useMemo(() => {
    const item = invoice.items?.[0];
    const total = Number(item?.quantidade || 0) * Number(item?.valorUnitario || 0);
    const iss = (total * Number(item?.aliquotaIss || 0)) / 100;
    return { total, iss };
  }, [invoice.items]);

  const save = async () => {
    try {
      setIsSaving(true);
      const item = invoice.items?.[0] || BASE_ITEM;
      const payload = {
        appointmentId: invoice.appointmentId,
        ambiente: (invoice.ambiente || "HOMOLOGACAO") as "HOMOLOGACAO" | "PRODUCAO",
        municipioCodigoIbge: invoice.municipioCodigoIbge || "",
        // provedor omitido — backend seleciona automaticamente pelo município
        numeroRps: Number(invoice.numeroRps || 0),
        serieRps: invoice.serieRps || "",
        dataCompetencia: invoice.dataCompetencia || new Date().toISOString().slice(0, 10),
        naturezaOperacao: invoice.naturezaOperacao || "",
        itemListaServico: invoice.itemListaServico || "",
        valorServicos: preview.total,
        valorDeducoes: Number(invoice.valorDeducoes || 0),
        valorIss: preview.iss,
        aliquotaIss: Number(invoice.aliquotaIss || item.aliquotaIss || 0),
        issRetido: Boolean(invoice.issRetido),
        notes: invoice.notes,
        codigoTributacaoMunicipio: invoice.codigoTributacaoMunicipio,
        customer: {
          type: (invoice.customer?.type || "CPF") as "CPF" | "CNPJ" | "EXTERIOR",
          document: invoice.customer?.document,
          countryCode: invoice.customer?.countryCode,
          documentType: invoice.customer?.documentType,
          name: invoice.customer?.name || "",
          email: invoice.customer?.email,
          phone: invoice.customer?.phone,
        },
        items: [
          {
            lineNumber: 1,
            descricaoServico: item.descricaoServico || "",
            quantidade: Number(item.quantidade || 0),
            valorUnitario: Number(item.valorUnitario || 0),
            valorTotal: preview.total,
            itemListaServico: item.itemListaServico || invoice.itemListaServico || "",
            codigoTributacaoMunicipio:
              item.codigoTributacaoMunicipio || invoice.codigoTributacaoMunicipio,
            aliquotaIss: Number(item.aliquotaIss || 0),
            valorIss: preview.iss,
          },
        ],
      };
      const saved = await nfseApi.createInvoice(payload);
      toast.success("Rascunho NFS-e criado.", {
        description: "Acesse o historico para autorizar ou ver detalhes.",
        action: {
          label: "Ver detalhes",
          onClick: () => window.open(`/fiscal/nfse/${saved.id}`, "_blank"),
        },
      });
      onSaved?.(saved.id);
    } catch (error) {
      showError(error, "Erro ao salvar rascunho NFS-e");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEmitir = async () => {
    setIsEmitting(true);
    try {
      const saved = await (async () => {
        setIsSaving(true);
        try {
          const item = invoice.items?.[0] || BASE_ITEM;
          const payload = {
            appointmentId: invoice.appointmentId,
            ambiente: (invoice.ambiente || "HOMOLOGACAO") as "HOMOLOGACAO" | "PRODUCAO",
            municipioCodigoIbge: invoice.municipioCodigoIbge || "",
            numeroRps: Number(invoice.numeroRps || 0),
            serieRps: invoice.serieRps || "",
            dataCompetencia: invoice.dataCompetencia || new Date().toISOString().slice(0, 10),
            naturezaOperacao: invoice.naturezaOperacao || "",
            itemListaServico: invoice.itemListaServico || "",
            valorServicos: preview.total,
            valorDeducoes: Number(invoice.valorDeducoes || 0),
            valorIss: preview.iss,
            aliquotaIss: Number(invoice.aliquotaIss || item.aliquotaIss || 0),
            issRetido: Boolean(invoice.issRetido),
            notes: invoice.notes,
            codigoTributacaoMunicipio: invoice.codigoTributacaoMunicipio,
            customer: {
              type: (invoice.customer?.type || "CPF") as "CPF" | "CNPJ" | "EXTERIOR",
              document: invoice.customer?.document,
              countryCode: invoice.customer?.countryCode,
              documentType: invoice.customer?.documentType,
              name: invoice.customer?.name || "",
              email: invoice.customer?.email,
              phone: invoice.customer?.phone,
            },
            items: [
              {
                lineNumber: 1,
                descricaoServico: item.descricaoServico || "",
                quantidade: Number(item.quantidade || 0),
                valorUnitario: Number(item.valorUnitario || 0),
                valorTotal: preview.total,
                itemListaServico: item.itemListaServico || invoice.itemListaServico || "",
                codigoTributacaoMunicipio:
                  item.codigoTributacaoMunicipio || invoice.codigoTributacaoMunicipio,
                aliquotaIss: Number(item.aliquotaIss || 0),
                valorIss: preview.iss,
              },
            ],
          };
          return await nfseApi.createInvoice(payload);
        } finally {
          setIsSaving(false);
        }
      })();

      if (!saved?.id) return;

      await nfseApi.authorizeInvoice(saved.id, {});
      toast.success("NFS-e emitida com sucesso!", {
        description: "A nota foi enviada para autorizacao na prefeitura.",
      });
      onSaved?.(saved.id);
      navigate(`/fiscal/nfse/${saved.id}`);
    } catch (error) {
      showError(error, "Erro ao emitir NFS-e");
    } finally {
      setIsEmitting(false);
    }
  };

  const applyTomadorCnpjData = (data: CnpjConsultaResponse) => {
    setInvoice((prev) => ({
      ...prev,
      customer: {
        ...(prev.customer as NfseInvoice["customer"]),
        type: "CNPJ",
        document: data.cnpj || prev.customer?.document || "",
        name: data.razaoSocial || prev.customer?.name || "",
        // email e telefone: NÃO preencher automaticamente (LGPD — MEI pode ter dados de PF)
        email: prev.customer?.email,
        phone: prev.customer?.phone,
      },
    }));
    const address = data.endereco;
    const addressText = address
      ? [
          address.logradouro,
          address.numero,
          address.complemento,
          address.bairro,
          address.municipio,
          address.uf,
          address.cep,
        ]
          .filter(Boolean)
          .join(", ")
      : null;
    setTomadorAddressPreview(addressText || null);
  };

  const applyNbsCode = (code: string) => {
    setInvoice((prev) => ({
      ...prev,
      codigoTributacaoMunicipio: code,
      items: [{ ...(prev.items?.[0] || BASE_ITEM), codigoTributacaoMunicipio: code }],
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova NFS-e — Dados principais</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Ambiente</Label>
            <Select
              value={invoice.ambiente || "HOMOLOGACAO"}
              onValueChange={(value: "HOMOLOGACAO" | "PRODUCAO") =>
                setInvoice((prev) => ({ ...prev, ambiente: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HOMOLOGACAO">HOMOLOGACAO</SelectItem>
                <SelectItem value="PRODUCAO">PRODUCAO</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Municipio IBGE</Label>
            <Input
              value={invoice.municipioCodigoIbge || ""}
              onChange={(e) =>
                setInvoice((prev) => ({ ...prev, municipioCodigoIbge: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Numero RPS</Label>
            <Input
              type="number"
              placeholder="Auto"
              value={invoice.numeroRps || ""}
              onChange={(e) =>
                setInvoice((prev) => ({ ...prev, numeroRps: Number(e.target.value || 0) }))
              }
            />
            <p className="text-xs text-muted-foreground">Deixe 0 para numerar automaticamente.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Tipo do tomador</Label>
            <Select
              value={invoice.customer?.type || "CPF"}
              onValueChange={(value: "CPF" | "CNPJ" | "EXTERIOR") => {
                if (value !== "CNPJ") {
                  setTomadorAddressPreview(null);
                }
                setInvoice((prev) => ({
                  ...prev,
                  customer: {
                    ...(prev.customer as NfseInvoice["customer"]),
                    type: value,
                    document: prev.customer?.document || "",
                  },
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CPF">CPF</SelectItem>
                <SelectItem value="CNPJ">CNPJ</SelectItem>
                <SelectItem value="EXTERIOR">Exterior</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tomador - nome</Label>
            <Input
              value={invoice.customer?.name || ""}
              onChange={(e) =>
                setInvoice((prev) => ({
                  ...prev,
                  customer: {
                    ...(prev.customer as NfseInvoice["customer"]),
                    name: e.target.value,
                  },
                }))
              }
            />
          </div>
          <div className="space-y-2">
            {invoice.customer?.type === "CNPJ" ? (
              <CnpjAutoFillField
                id="nfse-embed-tomador-documento"
                label="Tomador - CNPJ"
                value={invoice.customer?.document || ""}
                onChange={(value) =>
                  setInvoice((prev) => ({
                    ...prev,
                    customer: {
                      ...(prev.customer as NfseInvoice["customer"]),
                      type: "CNPJ",
                      document: value,
                    },
                  }))
                }
                onDataLoaded={applyTomadorCnpjData}
              />
            ) : (
              <>
                <Label>Tomador - documento</Label>
                <Input
                  value={invoice.customer?.document || ""}
                  onChange={(e) =>
                    setInvoice((prev) => ({
                      ...prev,
                      customer: {
                        ...(prev.customer as NfseInvoice["customer"]),
                        document: e.target.value,
                      },
                    }))
                  }
                  placeholder={invoice.customer?.type === "CPF" ? "000.000.000-00" : "Documento do tomador"}
                />
              </>
            )}
          </div>
        </div>

        {tomadorAddressPreview ? (
          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            <p className="font-medium">Endereco sugerido do tomador</p>
            <p className="text-muted-foreground">{tomadorAddressPreview}</p>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Descricao servico</Label>
            <Input
              value={invoice.items?.[0]?.descricaoServico || ""}
              onChange={(e) =>
                setInvoice((prev) => ({
                  ...prev,
                  items: [
                    { ...(prev.items?.[0] || BASE_ITEM), descricaoServico: e.target.value },
                  ],
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Quantidade</Label>
            <Input
              type="number"
              value={invoice.items?.[0]?.quantidade || 0}
              onChange={(e) =>
                setInvoice((prev) => ({
                  ...prev,
                  items: [
                    {
                      ...(prev.items?.[0] || BASE_ITEM),
                      quantidade: Number(e.target.value || 0),
                    },
                  ],
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Valor unitario</Label>
            <CurrencyInput
              value={invoice.items?.[0]?.valorUnitario ?? 0}
              onChange={(val) =>
                setInvoice((prev) => ({
                  ...prev,
                  items: [
                    {
                      ...(prev.items?.[0] || BASE_ITEM),
                      valorUnitario: val,
                    },
                  ],
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Codigo tributacao (NBS)</Label>
            <Input
              value={invoice.codigoTributacaoMunicipio || ""}
              onChange={(e) => applyNbsCode(e.target.value)}
              placeholder="Ex.: 060101"
            />
          </div>
        </div>

        <NbsCatalogSearch onSelect={applyNbsCode} />

        <div className="rounded-md border p-3 text-sm">
          <p>
            Total servicos: <strong>R$ {preview.total.toFixed(2)}</strong>
          </p>
          <p>
            ISS estimado: <strong>R$ {preview.iss.toFixed(2)}</strong>
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => void save()} disabled={isSaving || isEmitting}>
            {isSaving ? "Salvando..." : "Salvar rascunho"}
          </Button>
          <Button onClick={() => void handleEmitir()} disabled={isEmitting || isSaving}>
            {isEmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Emitindo...
              </>
            ) : (
              "Emitir NFS-e"
            )}
          </Button>
          <Button variant="outline" asChild>
            <Link to="/fiscal/nfse/nova" target="_blank" rel="noopener noreferrer">
              Abrir formulario completo
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
