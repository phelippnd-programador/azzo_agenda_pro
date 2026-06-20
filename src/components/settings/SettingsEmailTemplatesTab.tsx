import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { settingsApi } from '@/lib/api';
import { resolveUiError } from '@/lib/error-utils';
import { toast } from 'sonner';
import { Mail, Pencil } from 'lucide-react';
import type { EmailTemplateListItem, EmailTemplateDetail } from '@/lib/api';

const templateTypeLabels: Record<string, string> = {
  PASSWORD_RESET: 'Redefinicao de senha',
  APPOINTMENT_CONFIRMATION: 'Confirmacao de agendamento',
  APPOINTMENT_REMINDER: 'Lembrete de agendamento',
  APPOINTMENT_CANCELLATION: 'Cancelamento de agendamento',
  WELCOME: 'Boas-vindas',
};

function getTypeLabel(type: string): string {
  return templateTypeLabels[type] ?? type;
}

type EditForm = Omit<EmailTemplateDetail, 'type' | 'customized'>;

const EMPTY_FORM: EditForm = {
  subjectTemplate: '',
  htmlTemplate: '',
  fromEmail: null,
  fromName: null,
  replyTo: null,
};

export function SettingsEmailTemplatesTab() {
  const [templates, setTemplates] = useState<EmailTemplateListItem[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [detail, setDetail] = useState<EmailTemplateDetail | null>(null);
  const [form, setForm] = useState<EditForm>(EMPTY_FORM);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    settingsApi
      .getEmailTemplates()
      .then((data) => setTemplates(data))
      .catch(() => undefined);
  }, []);

  const openTemplate = async (type: string) => {
    setSelectedType(type);
    setIsLoadingDetail(true);
    try {
      const data = await settingsApi.getEmailTemplate(type);
      setDetail(data);
      setForm({
        subjectTemplate: data.subjectTemplate,
        htmlTemplate: data.htmlTemplate,
        fromEmail: data.fromEmail,
        fromName: data.fromName,
        replyTo: data.replyTo,
      });
    } catch (error) {
      toast.error(resolveUiError(error, 'Erro ao carregar template').message);
      setSelectedType(null);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleClose = () => {
    setSelectedType(null);
    setDetail(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!selectedType) return;
    setIsSaving(true);
    try {
      const updated = await settingsApi.updateEmailTemplate(selectedType, form);
      setDetail(updated);
      setTemplates((prev) =>
        prev.map((t) => (t.type === selectedType ? { ...t, customized: updated.customized } : t))
      );
      toast.success('Template salvo com sucesso!');
      handleClose();
    } catch (error) {
      toast.error(resolveUiError(error, 'Erro ao salvar template').message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestoreDefault = async () => {
    if (!selectedType) return;
    setIsSaving(true);
    try {
      const updated = await settingsApi.updateEmailTemplate(selectedType, {
        subjectTemplate: '',
        htmlTemplate: '',
        fromEmail: null,
        fromName: null,
        replyTo: null,
      });
      setDetail(updated);
      setForm({
        subjectTemplate: updated.subjectTemplate,
        htmlTemplate: updated.htmlTemplate,
        fromEmail: updated.fromEmail,
        fromName: updated.fromName,
        replyTo: updated.replyTo,
      });
      setTemplates((prev) =>
        prev.map((t) => (t.type === selectedType ? { ...t, customized: false } : t))
      );
      toast.success('Template restaurado para o padrao do sistema.');
    } catch (error) {
      toast.error(resolveUiError(error, 'Erro ao restaurar template').message);
    } finally {
      setIsSaving(false);
    }
  };

  const setFormField = (field: keyof EditForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value || null }));
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Templates de E-mail
          </CardTitle>
          <CardDescription>
            Personalize os modelos de e-mail transacional enviados pelo sistema. Clique em um template para editar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum template disponivel.</p>
          ) : (
            <div className="divide-y rounded-lg border">
              {templates.map((template) => (
                <div
                  key={template.type}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{getTypeLabel(template.type)}</p>
                      <p className="text-xs text-muted-foreground">{template.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {template.customized ? (
                      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                        Customizado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Padrao
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openTemplate(template.type)}
                    >
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      Editar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedType} onOpenChange={(open) => { if (!open) handleClose(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedType ? getTypeLabel(selectedType) : 'Template de E-mail'}
            </DialogTitle>
            <DialogDescription>
              Edite os campos abaixo para personalizar o template. Use variaveis como {'{{'} userName {'}'} no assunto e no corpo.
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetail ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              Carregando template...
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="et-subject">Assunto</Label>
                <Input
                  id="et-subject"
                  value={form.subjectTemplate ?? ''}
                  onChange={(e) => setFormField('subjectTemplate', e.target.value)}
                  placeholder="ex: Redefinicao de senha para {{userName}}"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="et-from-name">De (nome)</Label>
                  <Input
                    id="et-from-name"
                    value={form.fromName ?? ''}
                    onChange={(e) => setFormField('fromName', e.target.value)}
                    placeholder="ex: Equipe Azzo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="et-from-email">De (e-mail)</Label>
                  <Input
                    id="et-from-email"
                    type="email"
                    value={form.fromEmail ?? ''}
                    onChange={(e) => setFormField('fromEmail', e.target.value)}
                    placeholder="ex: noreply@exemplo.com.br"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="et-reply-to">Responder para</Label>
                <Input
                  id="et-reply-to"
                  type="email"
                  value={form.replyTo ?? ''}
                  onChange={(e) => setFormField('replyTo', e.target.value)}
                  placeholder="ex: suporte@exemplo.com.br"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="et-html">Corpo do e-mail (HTML)</Label>
                <textarea
                  id="et-html"
                  value={form.htmlTemplate ?? ''}
                  onChange={(e) => setFormField('htmlTemplate', e.target.value)}
                  rows={10}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="<p>Ola, {{userName}}!</p>"
                />
              </div>

              {detail?.customized ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  Este template possui customizacao propria do tenant. Ao restaurar o padrao, o template do sistema sera utilizado.
                </div>
              ) : null}
            </div>
          )}

          <DialogFooter className="gap-2">
            {detail?.customized ? (
              <Button
                variant="outline"
                onClick={handleRestoreDefault}
                disabled={isSaving || isLoadingDetail}
              >
                Restaurar padrao
              </Button>
            ) : null}
            <Button
              onClick={handleSave}
              disabled={isSaving || isLoadingDetail}
            >
              {isSaving ? 'Salvando...' : 'Salvar template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
