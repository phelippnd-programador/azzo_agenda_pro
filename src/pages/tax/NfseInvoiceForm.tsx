import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AlertTriangle, Loader2 } from "lucide-react";
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
import { formatCurrency } from "@/lib/format";
import { CurrencyInput } from "@/components/ui/currency-input";
import type { CnpjConsultaResponse } from "@/lib/api/cnpj";
import { getNfseEmissionPendencies } from "@/lib/nfse-emission-pendencies";
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
  const [isEmitting, setIsEmitting] = useState(false);
  const [configMissing, setConfigMissing] = useState(false);
  const [emitPendencies, setEmitPendencies] = useState<string[]>([]);
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
      // Busca os padrões do tenant em qualquer ambiente configurado (antes só
      // HOMOLOGACAO: quem configurou direto PRODUCAO não recebia os padrões).
      let cfg: Awaited<ReturnType<typeof nfseApi.getConfig>> | null = null;
      for (const ambiente of ["HOMOLOGACAO", "PRODUCAO"] as const) {
        try {
          cfg = await nfseApi.getConfig(ambiente);
          break;
        } catch {
          // tenta o próximo ambiente
        }
      }
      if (!cfg) {
        // Antecipação de erro: sem configuração NFS-e a emissão falharia no
        // final do preenchimento — avisa já na entrada, com atalho para a tela.
        setConfigMissing(true);
        return;
      }
      const config = cfg;
      setInvoice((prev) => ({
        ...prev,
        municipioCodigoIbge: config.municipioCodigoIbge || prev.municipioCodigoIbge,
        provedor: config.provedor || prev.provedor,
        serieRps: config.serieRps || prev.serieRps,
        aliquotaIss: config.aliquotaIssPadrao ?? prev.aliquotaIss,
        itemListaServico: config.itemListaServicoPadrao || prev.itemListaServico,
        codigoTributacaoMunicipio: config.codigoTributacaoMunicipio || prev.codigoTributacaoMunicipio,
        items: [
          {
            ...(prev.items?.[0] || BASE_ITEM),
            itemListaServico: config.itemListaServicoPadrao || prev.items?.[0]?.itemListaServico || "1.01",
            aliquotaIss: config.aliquotaIssPadrao ?? prev.items?.[0]?.aliquotaIss ?? 5,
          },
        ],
      }));
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

  const buildPayload = () => {
    const item = invoice.items?.[0] || BASE_ITEM;
    return {
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
  };

  const save = async () => {
    try {
      setIsSaving(true);
      const payload = buildPayload();
      const saved =
        mode === "edit" && id
          ? await nfseApi.updateInvoice(id, payload)
          : await nfseApi.createInvoice(payload);
      toast.success(mode === "edit" ? "Rascunho atualizado." : "Rascunho criado.");
      navigate(`/fiscal/nfse/${saved.id}`);
      return saved;
    } catch (error) {
      showError(error, "Erro ao salvar rascunho NFS-e");
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handleEmitir = async () => {
    // Validação antecipada: aponta o que falta ANTES de chamar a API, em vez
    // de deixar o usuário esperar para receber um erro do provedor.
    const pendencies = getNfseEmissionPendencies({
      municipioCodigoIbge: invoice.municipioCodigoIbge,
      customerType: (invoice.customer?.type || "CPF") as "CPF" | "CNPJ" | "EXTERIOR",
      customerName: invoice.customer?.name,
      customerDocument: invoice.customer?.document,
      descricaoServico: invoice.items?.[0]?.descricaoServico,
      quantidade: invoice.items?.[0]?.quantidade,
      valorUnitario: invoice.items?.[0]?.valorUnitario,
    });
    setEmitPendencies(pendencies);
    if (pendencies.length > 0) {
      toast.error("Para emitir, complete os campos pendentes listados no formulario.");
      return;
    }

    setIsEmitting(true);
    try {
      setIsSaving(true);
      const payload = buildPayload();
      const saved =
        mode === "edit" && id
          ? await nfseApi.updateInvoice(id, payload)
          : await nfseApi.createInvoice(payload);
      setIsSaving(false);

      if (!saved?.id) return;

      await nfseApi.authorizeInvoice(saved.id, {});
      toast.success("NFS-e emitida com sucesso!", {
        description: "A nota foi enviada para autorizacao na prefeitura.",
      });
      navigate(`/fiscal/nfse/${saved.id}`);
    } catch (error) {
      showError(error, "Erro ao emitir NFS-e");
    } finally {
      setIsSaving(false);
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
    <MainLayout
      title={mode === "edit" ? "Editar rascunho NFS-e" : "Nova NFS-e"}
      subtitle="Cadastro manual para emissao posterior."
    >
      {configMissing ? (
        <div className="mb-4 flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <div>
            <p className="font-medium">Configuracao NFS-e nao encontrada</p>
            <p className="mt-0.5">
              Sem municipio, provedor e certificado configurados, a emissao vai falhar. Configure
              primeiro em{" "}
              <Link to="/fiscal?tab=config&subtab=nfse" className="font-medium underline">
                Fiscal &gt; Configuracoes &gt; NFS-e
              </Link>
              . Voce ainda pode preencher e salvar um rascunho.
            </p>
          </div>
        </div>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Dados principais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2" data-tour="nfse-ambiente">
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
                  <SelectItem value="HOMOLOGACAO">Homologacao (teste, sem valor fiscal)</SelectItem>
                  <SelectItem value="PRODUCAO">Producao (emite a nota de verdade)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nfse-municipio-ibge">Municipio IBGE</Label>
              <Input
                id="nfse-municipio-ibge"
                value={invoice.municipioCodigoIbge || ""}
                onChange={(e) =>
                  setInvoice((prev) => ({ ...prev, municipioCodigoIbge: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nfse-numero-rps">Numero RPS</Label>
              <Input
                id="nfse-numero-rps"
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

          <div className="grid gap-4 md:grid-cols-3" data-tour="nfse-tomador">
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
              <Label htmlFor="nfse-tomador-nome">Tomador - nome</Label>
              <Input
                id="nfse-tomador-nome"
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
                  <Label htmlFor="nfse-tomador-documento">Tomador - documento</Label>
                  <Input
                    id="nfse-tomador-documento"
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

          <div className="grid gap-4 md:grid-cols-3" data-tour="nfse-servico">
            <div className="space-y-2">
              <Label htmlFor="nfse-descricao-servico">Descricao servico</Label>
              <Input
                id="nfse-descricao-servico"
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
              <Label htmlFor="nfse-quantidade">Quantidade</Label>
              <Input
                id="nfse-quantidade"
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
              <Label htmlFor="nfse-valor-unitario">Valor unitario</Label>
              <CurrencyInput
                id="nfse-valor-unitario"
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
              <Label htmlFor="nfse-codigo-tributacao">Codigo tributacao (NBS)</Label>
              <Input
                id="nfse-codigo-tributacao"
                value={invoice.codigoTributacaoMunicipio || ""}
                onChange={(e) => applyNbsCode(e.target.value)}
                placeholder="Ex.: 060101"
              />
            </div>
          </div>

          <NbsCatalogSearch onSelect={applyNbsCode} />

          <div className="rounded-md border p-3 text-sm" data-tour="nfse-resumo">
            <p>
              Total servicos: <strong>{formatCurrency(preview.total)}</strong>
            </p>
            <p>
              ISS estimado: <strong>{formatCurrency(preview.iss)}</strong>
            </p>
          </div>

          {emitPendencies.length > 0 ? (
            <div
              className="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
              role="alert"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
              <div>
                <p className="font-medium">Para emitir, complete:</p>
                <ul className="mt-1 list-disc pl-4">
                  {emitPendencies.map((pendency) => (
                    <li key={pendency}>{pendency}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => void handleEmitir()}
              disabled={isEmitting || isSaving}
              data-tour="nfse-emitir"
            >
              {isEmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Emitindo...
                </>
              ) : (
                "Emitir NFS-e"
              )}
            </Button>
            <Button variant="outline" onClick={() => void save()} disabled={isSaving || isEmitting}>
              {isSaving && !isEmitting
                ? "Salvando..."
                : mode === "edit"
                ? "Atualizar rascunho"
                : "Salvar rascunho"}
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/fiscal/nfse">Cancelar</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
