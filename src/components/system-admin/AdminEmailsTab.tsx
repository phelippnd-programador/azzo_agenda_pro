import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { systemAdminApi } from '@/lib/api';
import { toast } from 'sonner';
import type {
  EmailTemplateDetailResponse,
  EmailTemplateSummaryItem,
  EmailTemplateUpsertRequest,
} from '@/types/system-admin';

type EmailTemplateFormState = {
  templateType: string;
  label: string;
  configured: boolean;
  active: boolean;
  fromEmail: string;
  fromName: string;
  replyTo: string;
  subjectTemplate: string;
  htmlTemplate: string;
  placeholders: string[];
  sampleValues: Record<string, string>;
};

const createEmptyForm = (): EmailTemplateFormState => ({
  templateType: 'PASSWORD_RESET',
  label: 'Redefinicao de senha',
  configured: false,
  active: true,
  fromEmail: '',
  fromName: '',
  replyTo: '',
  subjectTemplate: '',
  htmlTemplate: '',
  placeholders: [],
  sampleValues: {},
});

const applyPreview = (template: string, values: Record<string, string>) => {
  let rendered = template || '';
  Object.entries(values || {}).forEach(([key, value]) => {
    rendered = rendered.replaceAll(`{{${key}}}`, value ?? '');
  });
  return rendered;
};

export function AdminEmailsTab() {
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplateSummaryItem[]>([]);
  const [selectedType, setSelectedType] = useState('PASSWORD_RESET');
  const [form, setForm] = useState<EmailTemplateFormState>(createEmptyForm);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const previewSubject = useMemo(() => applyPreview(form.subjectTemplate, form.sampleValues), [form.subjectTemplate, form.sampleValues]);
  const previewHtml = useMemo(() => applyPreview(form.htmlTemplate, form.sampleValues), [form.htmlTemplate, form.sampleValues]);

  const applyDetail = (detail: EmailTemplateDetailResponse) => {
    setForm({
      templateType: detail.templateType,
      label: detail.label,
      configured: detail.configured,
      active: detail.active,
      fromEmail: detail.fromEmail || '',
      fromName: detail.fromName || '',
      replyTo: detail.replyTo || '',
      subjectTemplate: detail.subjectTemplate || '',
      htmlTemplate: detail.htmlTemplate || '',
      placeholders: detail.placeholders || [],
      sampleValues: detail.sampleValues || {},
    });
  };

  const buildPayload = (): EmailTemplateUpsertRequest => ({
    active: form.active,
    fromEmail: form.fromEmail.trim() || undefined,
    fromName: form.fromName.trim() || undefined,
    replyTo: form.replyTo.trim() || undefined,
    subjectTemplate: form.subjectTemplate,
    htmlTemplate: form.htmlTemplate,
  });

  const loadEmailTemplates = async (templateType?: string) => {
    setIsLoading(true);
    try {
      const response = await systemAdminApi.listEmailTemplates();
      const items = response.items || [];
      setEmailTemplates(items);
      const effectiveType = templateType || selectedType || items[0]?.templateType || 'PASSWORD_RESET';
      const detail = await systemAdminApi.getEmailTemplate(effectiveType);
      setSelectedType(detail.templateType);
      applyDetail(detail);
    } catch {
      toast.error('Nao foi possivel carregar templates de email.');
      setEmailTemplates([]);
      setForm(createEmptyForm());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEmailTemplates();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectTemplate = async (templateType: string) => {
    setSelectedType(templateType);
    setIsLoading(true);
    try {
      const detail = await systemAdminApi.getEmailTemplate(templateType);
      applyDetail(detail);
    } catch {
      toast.error('Nao foi possivel carregar o template selecionado.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveEmailTemplate = async () => {
    if (!form.subjectTemplate.trim() || !form.htmlTemplate.trim()) {
      toast.error('Assunto e HTML sao obrigatorios.');
      return;
    }
    setIsSaving(true);
    try {
      const saved = await systemAdminApi.updateEmailTemplate(selectedType, buildPayload());
      applyDetail(saved);
      await loadEmailTemplates(saved.templateType);
      toast.success(form.configured ? 'Template atualizado com sucesso.' : 'Template criado com sucesso.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao salvar template.');
    } finally {
      setIsSaving(false);
    }
  };

  const createEmailTemplate = async () => {
    if (!form.subjectTemplate.trim() || !form.htmlTemplate.trim()) {
      toast.error('Assunto e HTML sao obrigatorios.');
      return;
    }
    setIsSaving(true);
    try {
      const created = await systemAdminApi.updateEmailTemplate(selectedType, { ...buildPayload(), active: true });
      applyDetail(created);
      await loadEmailTemplates(created.templateType);
      toast.success('Template criado com sucesso.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao criar template.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStatus = async (active: boolean) => {
    setIsSaving(true);
    try {
      const updated = await systemAdminApi.updateEmailTemplateStatus(selectedType, { active });
      applyDetail(updated);
      await loadEmailTemplates(updated.templateType);
      toast.success(active ? 'Template ativado.' : 'Template desativado.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao atualizar status do template.');
    } finally {
      setIsSaving(false);
    }
  };

  const restoreDefault = async () => {
    setIsSaving(true);
    try {
      const restored = await systemAdminApi.restoreDefaultEmailTemplate(selectedType);
      applyDetail(restored);
      await loadEmailTemplates(restored.templateType);
      toast.success('Template restaurado para o padrao.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao restaurar template.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Templates de email</CardTitle>
        <CardDescription>
          Edite assunto, remetente e HTML dos emails do sistema com preview em tempo real.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Tipos de template</h3>
              <Button variant="outline" size="sm" onClick={() => loadEmailTemplates()} disabled={isLoading}>
                Atualizar
              </Button>
            </div>
            <div className="space-y-2">
              {emailTemplates.map((item) => (
                <button
                  key={item.templateType}
                  type="button"
                  onClick={() => selectTemplate(item.templateType)}
                  className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                    selectedType === item.templateType
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.templateType}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={item.configured ? 'default' : 'secondary'}>
                        {item.configured ? 'Configurado' : 'Padrao'}
                      </Badge>
                      <Badge variant={item.active ? 'default' : 'outline'}>
                        {item.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {item.updatedAt
                      ? `Atualizado em ${new Date(item.updatedAt).toLocaleString('pt-BR')}`
                      : 'Usando fallback padrao do sistema'}
                  </p>
                </button>
              ))}
              {!isLoading && emailTemplates.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Nenhum template disponivel.
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid gap-6 2xl:grid-cols-2">
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-base">{form.label}</CardTitle>
                <CardDescription>
                  O template salvo aqui passa a ser usado no envio real do sistema.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={form.configured ? 'default' : 'secondary'}>
                    {form.configured ? 'Template criado' : 'Template ainda nao criado'}
                  </Badge>
                  <Badge variant={form.active ? 'default' : 'outline'}>
                    {form.active ? 'Ativo no envio' : 'Inativo no envio'}
                  </Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>From email</Label>
                    <Input
                      value={form.fromEmail}
                      onChange={(e) => setForm((prev) => ({ ...prev, fromEmail: e.target.value }))}
                      placeholder="no-reply@azzoholding.com.br"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>From name</Label>
                    <Input
                      value={form.fromName}
                      onChange={(e) => setForm((prev) => ({ ...prev, fromName: e.target.value }))}
                      placeholder="Azzo Agenda Pro"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Reply-to</Label>
                  <Input
                    value={form.replyTo}
                    onChange={(e) => setForm((prev) => ({ ...prev, replyTo: e.target.value }))}
                    placeholder="support@azzoholding.com.br"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Assunto</Label>
                  <Input
                    value={form.subjectTemplate}
                    onChange={(e) => setForm((prev) => ({ ...prev, subjectTemplate: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>HTML</Label>
                  <Textarea
                    value={form.htmlTemplate}
                    onChange={(e) => setForm((prev) => ({ ...prev, htmlTemplate: e.target.value }))}
                    rows={20}
                    className="font-mono text-xs"
                  />
                </div>

                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm font-medium">Placeholders disponiveis</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {form.placeholders.map((placeholder) => (
                      <Badge key={placeholder} variant="secondary">
                        {placeholder}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  <Button variant="outline" onClick={restoreDefault} disabled={isSaving}>
                    Restaurar padrao
                  </Button>
                  {form.configured ? (
                    <Button variant="outline" onClick={() => toggleStatus(!form.active)} disabled={isSaving}>
                      {form.active ? 'Desativar' : 'Ativar'}
                    </Button>
                  ) : null}
                  {form.configured ? (
                    <Button onClick={saveEmailTemplate} disabled={isSaving}>
                      {isSaving ? 'Salvando...' : 'Salvar alteracoes'}
                    </Button>
                  ) : (
                    <Button onClick={createEmailTemplate} disabled={isSaving}>
                      {isSaving ? 'Criando...' : 'Criar template a partir do padrao'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preview</CardTitle>
                <CardDescription>
                  A visualizacao ao lado usa dados de exemplo e atualiza conforme voce edita o codigo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">From</p>
                    <p className="mt-2 text-sm font-medium">{form.fromName || 'Sem nome'}</p>
                    <p className="text-sm text-muted-foreground">{form.fromEmail || 'Fallback global'}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Reply-to</p>
                    <p className="mt-2 text-sm">{form.replyTo || 'Nao definido'}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Assunto renderizado</p>
                    <p className="mt-2 text-sm font-medium">{previewSubject || '-'}</p>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/20 p-4">
                  <p className="text-sm font-medium">Valores de exemplo</p>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {Object.entries(form.sampleValues || {}).map(([key, value]) => (
                      <div key={key} className="rounded-md border bg-background p-3">
                        <p className="text-xs text-muted-foreground">{`{{${key}}}`}</p>
                        <p className="mt-1 text-sm">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border bg-white">
                  <iframe
                    title="Preview do template de email"
                    srcDoc={previewHtml}
                    sandbox=""
                    className="h-[720px] w-full bg-white"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
