import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
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
import type { CnpjConsultaResponse } from "@/lib/api/cnpj";
import { resolveUiError } from "@/lib/error-utils";
import { toast } from "sonner";

type Mode = "create" | "edit";

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

export default function NfseInvoiceForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const mode: Mode = id ? "edit" : "create";
  const [isSaving, setIsSaving] = useState(false);
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
    if (mode !== "create") return;
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
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!id) return;
    void (async () => {
      try {
        const response = await nfseApi.getInvoice(id);
        setInvoice(response);
      } catch (error) {
        showError(error, "Erro ao carregar NFS-e");
      }
    })();
  }, [id]);

  useEffect(() => {
    if (mode !== "create") return;
    const raw = sessionStorage.getItem("nfseDraftPrefill");
    const fromQuery = searchParams.get("appointmentId");
    if (!raw && !fromQuery) return;
    try {
      const parsed = raw ? (JSON.parse(raw) as Partial<NfseInvoice>) : {};
      setInvoice((prev) => ({
        ...prev,
        ...parsed,
        appointmentId: fromQuery || parsed.appointmentId || prev.appointmentId,
        customer: { ...(prev.customer || {}), ...(parsed.customer || {}) },
        items: [{ ...(prev.items?.[0] || BASE_ITEM), ...(parsed.items?.[0] || {}) }],
      }));
      if (raw) sessionStorage.removeItem("nfseDraftPrefill");
    } catch {
      if (raw) sessionStorage.removeItem("nfseDraftPrefill");
    }
  }, [mode, searchParams]);

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
        provedor: invoice.provedor || "",
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
      const saved =
        mode === "edit" && id
          ? await nfseApi.updateInvoice(id, payload)
          : await nfseApi.createInvoice(payload);
      toast.success(mode === "edit" ? "Rascunho atualizado." : "Rascunho criado.");
      navigate(`/fiscal/nfse/${saved.id}`);
    } catch (error) {
      showError(error, "Erro ao salvar rascunho NFS-e");
    } finally {
      setIsSaving(false);
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
        email: data.emailSugestao || prev.customer?.email,
        phone: data.telefoneSugestao || prev.customer?.phone,
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
    <MainLayout
      title={mode === "edit" ? "Editar rascunho NFS-e" : "Nova NFS-e"}
      subtitle="Cadastro manual para emissao posterior."
    >
      <Card>
        <CardHeader>
          <CardTitle>Dados principais</CardTitle>
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
              <Label>Provedor</Label>
              <Input
                value={invoice.provedor || ""}
                onChange={(e) => setInvoice((prev) => ({ ...prev, provedor: e.target.value }))}
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
                      document: value === "EXTERIOR" ? prev.customer?.document || "" : prev.customer?.document || "",
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
                  id="nfse-tomador-documento"
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
              <Input
                type="number"
                value={invoice.items?.[0]?.valorUnitario || 0}
                onChange={(e) =>
                  setInvoice((prev) => ({
                    ...prev,
                    items: [
                      {
                        ...(prev.items?.[0] || BASE_ITEM),
                        valorUnitario: Number(e.target.value || 0),
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
            <Button onClick={() => void save()} disabled={isSaving}>
              {isSaving
                ? "Salvando..."
                : mode === "edit"
                ? "Atualizar rascunho"
                : "Salvar rascunho"}
            </Button>
            <Button variant="outline" asChild>
              <Link to="/fiscal/nfse">Cancelar</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
