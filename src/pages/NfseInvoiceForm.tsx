import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { nfseApi, type NfseInvoice } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import { NFSE_NBS_CATALOG } from "@/lib/nfseNbsCatalog";
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
  const [isLookingUpCnpj, setIsLookingUpCnpj] = useState(false);
  const [tomadorAddressPreview, setTomadorAddressPreview] = useState<string | null>(null);
  const [nbsSearch, setNbsSearch] = useState("");
  const showError = (error: unknown, fallbackMessage: string) => {
    const uiError = resolveUiError(error, fallbackMessage);
    toast.error(uiError.code ? `[${uiError.code}] ${uiError.message}` : uiError.message);
  };
  const [invoice, setInvoice] = useState<Partial<NfseInvoice>>({
    ambiente: "HOMOLOGACAO",
    municipioCodigoIbge: "3304557",
    provedor: "ABRASF",
    numeroRps: Date.now(),
    serieRps: "A1",
    dataCompetencia: new Date().toISOString().slice(0, 10),
    naturezaOperacao: "Prestacao de servico",
    itemListaServico: "1.01",
    valorServicos: 0,
    valorDeducoes: 0,
    valorIss: 0,
    aliquotaIss: 5,
    issRetido: false,
    customer: {
      type: "CPF",
      document: "",
      name: "",
      email: "",
      phone: "",
    },
    items: [BASE_ITEM],
  });

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
            codigoTributacaoMunicipio: item.codigoTributacaoMunicipio || invoice.codigoTributacaoMunicipio,
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

  const lookupTomadorByCnpj = async () => {
    const rawDocument = invoice.customer?.document || "";
    const cnpj = rawDocument.replace(/\D/g, "");
    if (cnpj.length !== 14) {
      toast.error("Informe um CNPJ valido (14 digitos) para consultar.");
      return;
    }
    try {
      setIsLookingUpCnpj(true);
      const data = await nfseApi.lookupTomadorByCnpj(cnpj);
      setInvoice((prev) => ({
        ...prev,
        customer: {
          ...(prev.customer as NfseInvoice["customer"]),
          type: "CNPJ",
          document: data.document || cnpj,
          name: data.name || prev.customer?.name || "",
          email: data.email || prev.customer?.email,
          phone: data.phone || prev.customer?.phone,
        },
      }));
      const address = data.address;
      const addressText = address
        ? [
            address.street,
            address.number,
            address.complement,
            address.neighborhood,
            address.city,
            address.state,
            address.zipCode,
          ]
            .filter(Boolean)
            .join(", ")
        : null;
      setTomadorAddressPreview(addressText || null);
      toast.success("Dados do tomador preenchidos. Confira antes de emitir.");
    } catch (error) {
      setTomadorAddressPreview(null);
      showError(error, "Nao foi possivel consultar CNPJ do tomador");
    } finally {
      setIsLookingUpCnpj(false);
    }
  };

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
        customer: {
          ...(prev.customer || {}),
          ...(parsed.customer || {}),
        },
        items: [
          {
            ...(prev.items?.[0] || BASE_ITEM),
            ...(parsed.items?.[0] || {}),
          },
        ],
      }));
      if (raw) sessionStorage.removeItem("nfseDraftPrefill");
    } catch {
      if (raw) sessionStorage.removeItem("nfseDraftPrefill");
    }
  }, [mode, searchParams]);

  const nbsMatches = useMemo(() => {
    const needle = nbsSearch.trim().toLowerCase();
    if (!needle) return [];
    return NFSE_NBS_CATALOG.filter(
      (entry) =>
        entry.code.includes(needle) ||
        entry.description.toLowerCase().includes(needle)
    ).slice(0, 8);
  }, [nbsSearch]);

  return (
    <MainLayout title={mode === "edit" ? "Editar rascunho NFS-e" : "Nova NFS-e"} subtitle="Cadastro manual para emissao posterior.">
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
                onChange={(e) => setInvoice((prev) => ({ ...prev, municipioCodigoIbge: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Provedor</Label>
              <Input value={invoice.provedor || ""} onChange={(e) => setInvoice((prev) => ({ ...prev, provedor: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Numero RPS</Label>
              <Input
                type="number"
                value={invoice.numeroRps || 0}
                onChange={(e) => setInvoice((prev) => ({ ...prev, numeroRps: Number(e.target.value || 0) }))}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Tomador - nome</Label>
              <Input
                value={invoice.customer?.name || ""}
                onChange={(e) =>
                  setInvoice((prev) => ({
                    ...prev,
                    customer: { ...(prev.customer as NfseInvoice["customer"]), name: e.target.value },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Tomador - documento</Label>
              <Input
                value={invoice.customer?.document || ""}
                onChange={(e) =>
                  setInvoice((prev) => ({
                    ...prev,
                    customer: { ...(prev.customer as NfseInvoice["customer"]), document: e.target.value },
                  }))
                }
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={lookupTomadorByCnpj}
                  disabled={isLookingUpCnpj}
                >
                  {isLookingUpCnpj ? "Consultando..." : "Buscar CNPJ"}
                </Button>
              </div>
            </div>
          </div>
          {tomadorAddressPreview && (
            <div className="rounded-md border bg-muted/30 p-3 text-sm">
              <p className="font-medium">Endereco sugerido do tomador</p>
              <p className="text-muted-foreground">{tomadorAddressPreview}</p>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Descricao servico</Label>
              <Input
                value={invoice.items?.[0]?.descricaoServico || ""}
                onChange={(e) =>
                  setInvoice((prev) => ({
                    ...prev,
                    items: [{ ...(prev.items?.[0] || BASE_ITEM), descricaoServico: e.target.value }],
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
                    items: [{ ...(prev.items?.[0] || BASE_ITEM), quantidade: Number(e.target.value || 0) }],
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
                    items: [{ ...(prev.items?.[0] || BASE_ITEM), valorUnitario: Number(e.target.value || 0) }],
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Codigo tributacao (NBS)</Label>
              <Input
                value={invoice.codigoTributacaoMunicipio || ""}
                onChange={(e) =>
                  setInvoice((prev) => ({
                    ...prev,
                    codigoTributacaoMunicipio: e.target.value,
                    items: [
                      {
                        ...(prev.items?.[0] || BASE_ITEM),
                        codigoTributacaoMunicipio: e.target.value,
                      },
                    ],
                  }))
                }
                placeholder="Ex.: 060101"
              />
            </div>
          </div>

          <div className="space-y-2 rounded-md border p-3">
            <Label>Busca local NBS (apoio)</Label>
            <Input
              value={nbsSearch}
              onChange={(e) => setNbsSearch(e.target.value)}
              placeholder="Digite codigo ou descricao NBS"
            />
            {nbsSearch.trim() && (
              <div className="max-h-44 overflow-auto rounded border">
                {nbsMatches.length === 0 ? (
                  <p className="p-2 text-sm text-muted-foreground">Nenhum codigo NBS encontrado.</p>
                ) : (
                  <ul className="divide-y text-sm">
                    {nbsMatches.map((entry) => (
                      <li key={entry.code} className="flex items-start justify-between gap-2 p-2">
                        <div>
                          <p className="font-medium">{entry.code}</p>
                          <p className="text-muted-foreground">{entry.description}</p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setInvoice((prev) => ({
                              ...prev,
                              codigoTributacaoMunicipio: entry.code,
                              items: [
                                {
                                  ...(prev.items?.[0] || BASE_ITEM),
                                  codigoTributacaoMunicipio: entry.code,
                                },
                              ],
                            }))
                          }
                        >
                          Usar
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="rounded-md border p-3 text-sm">
            <p>Total servicos: <strong>R$ {preview.total.toFixed(2)}</strong></p>
            <p>ISS estimado: <strong>R$ {preview.iss.toFixed(2)}</strong></p>
          </div>

          <div className="flex gap-2">
            <Button onClick={save} disabled={isSaving}>
              {isSaving ? "Salvando..." : mode === "edit" ? "Atualizar rascunho" : "Salvar rascunho"}
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
