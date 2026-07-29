import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogSection,
  DialogStickyFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Loader2 } from 'lucide-react';
import { maskPhoneBr } from '@/lib/input-masks';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import type { WorkingHours } from '@/types';

const defaultWorkingHours: WorkingHours[] = [
  { dayOfWeek: 1, startTime: '09:00', endTime: '18:00', isWorking: true },
  { dayOfWeek: 2, startTime: '09:00', endTime: '18:00', isWorking: true },
  { dayOfWeek: 3, startTime: '09:00', endTime: '18:00', isWorking: true },
  { dayOfWeek: 4, startTime: '09:00', endTime: '18:00', isWorking: true },
  { dayOfWeek: 5, startTime: '09:00', endTime: '18:00', isWorking: true },
  { dayOfWeek: 6, startTime: '09:00', endTime: '13:00', isWorking: true },
  { dayOfWeek: 0, startTime: '00:00', endTime: '00:00', isWorking: false },
];

const weekdayLabels: Record<number, string> = {
  0: 'Domingo', 1: 'Segunda', 2: 'Terca', 3: 'Quarta',
  4: 'Quinta', 5: 'Sexta', 6: 'Sabado',
};

type ProfessionalData = {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialties: string[];
  isActive: boolean;
  workingHours: WorkingHours[];
};

type FormPayload = {
  name: string;
  email: string;
  phone: string;
  specialties: string[];
  commissionRate: number;
  isActive: boolean;
  workingHours: WorkingHours[];
  userId?: string;
  createUser?: boolean;
};

interface ProfessionalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingProfessional: ProfessionalData | null;
  hasLinkedCurrentUserProfessional: boolean;
  specialties: Array<{ id: string; name: string }>;
  isLoadingSpecialties: boolean;
  specialtiesError: string | null;
  refetchSpecialties: () => void;
  onCreate: (data: FormPayload) => Promise<unknown>;
  onUpdate: (id: string, data: Partial<FormPayload>) => Promise<unknown>;
  /** Limite de profissionais do plano ja atingido — bloqueia apenas a criacao (edicao continua liberada). */
  creationLimitReached?: boolean;
  /**
   * Habilita criar especialidade sem sair do dialogo. Quando ausente (padrao da
   * pagina consolidada), a caixa segue sendo apenas selecao do catalogo
   * existente. O onboarding fornece porque um tenant novo comeca com zero
   * especialidades e ficaria sem saida dentro do assistente.
   */
  onCreateSpecialty?: (name: string) => Promise<unknown>;
  /**
   * Agrupa "profissional ativo" num bloco "Opcoes avancadas" recolhido. Default
   * false mantem o layout da pagina consolidada intacto.
   */
  advancedCollapsed?: boolean;
}

export function ProfessionalFormDialog({
  open,
  onOpenChange,
  editingProfessional,
  hasLinkedCurrentUserProfessional,
  specialties,
  isLoadingSpecialties,
  specialtiesError,
  refetchSpecialties,
  onCreate,
  onUpdate,
  creationLimitReached = false,
  onCreateSpecialty,
  advancedCollapsed = false,
}: ProfessionalFormDialogProps) {
  const { user } = useAuth();
  const [newSpecialty, setNewSpecialty] = useState('');
  const [isCreatingSpecialty, setIsCreatingSpecialty] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(!advancedCollapsed);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formWorkingHours, setFormWorkingHours] = useState<WorkingHours[]>(defaultWorkingHours);
  const [isWorkingHoursDisabled, setIsWorkingHoursDisabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkCurrentUser, setLinkCurrentUser] = useState(false);

  const canLinkCurrentUser =
    !!user && (user.role === 'OWNER' || user.role === 'ADMIN') && !editingProfessional;

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setSelectedSpecialties([]);
    setFormIsActive(true);
    setFormWorkingHours(defaultWorkingHours);
    setIsWorkingHoursDisabled(false);
    setLinkCurrentUser(false);
  };

  useEffect(() => {
    if (!open) return;
    if (!editingProfessional) {
      resetForm();
      return;
    }
    const prof = editingProfessional;
    setFormName(prof.name);
    setFormEmail(prof.email);
    setFormPhone(prof.phone);
    setSelectedSpecialties(prof.specialties || []);
    setFormIsActive(prof.isActive);
    const hasWorkingHours = Array.isArray(prof.workingHours) && prof.workingHours.length > 0;
    if (!hasWorkingHours) {
      setFormWorkingHours(defaultWorkingHours.map((item) => ({ ...item, startTime: '00:00', endTime: '00:00', isWorking: false })));
      setIsWorkingHoursDisabled(true);
    } else {
      const normalized = defaultWorkingHours.map((def) => {
        const current = prof.workingHours.find((item) => item.dayOfWeek === def.dayOfWeek);
        return current
          ? { dayOfWeek: current.dayOfWeek, startTime: current.startTime || def.startTime, endTime: current.endTime || def.endTime, isWorking: !!current.isWorking }
          : def;
      });
      setFormWorkingHours(normalized);
      setIsWorkingHoursDisabled(false);
    }
  }, [open, editingProfessional]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!canLinkCurrentUser || !linkCurrentUser || !user) return;
    setFormName((current) => current || user.name || '');
    setFormEmail(user.email || '');
    setFormPhone((current) => current || user.phone || '');
  }, [canLinkCurrentUser, linkCurrentUser, user]);

  const toggleSpecialty = (name: string) => {
    setSelectedSpecialties((prev) => prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]);
  };

  const handleCreateSpecialty = async () => {
    if (!onCreateSpecialty) return;
    const name = newSpecialty.trim();
    if (!name) return;
    const alreadyExists = specialties.some(
      (item) => item.name.trim().toLowerCase() === name.toLowerCase()
    );
    if (alreadyExists) {
      // Evita duplicar o catalogo so por diferenca de caixa/espaco: apenas marca a existente.
      const existing = specialties.find(
        (item) => item.name.trim().toLowerCase() === name.toLowerCase()
      );
      if (existing && !selectedSpecialties.includes(existing.name)) {
        setSelectedSpecialties((prev) => [...prev, existing.name]);
      }
      setNewSpecialty('');
      return;
    }
    setIsCreatingSpecialty(true);
    try {
      await onCreateSpecialty(name);
      setSelectedSpecialties((prev) => (prev.includes(name) ? prev : [...prev, name]));
      setNewSpecialty('');
    } finally {
      setIsCreatingSpecialty(false);
    }
  };

  const updateWorkingHour = (dayOfWeek: number, field: 'startTime' | 'endTime' | 'isWorking', value: string | boolean) => {
    setFormWorkingHours((prev) => prev.map((item) => item.dayOfWeek === dayOfWeek ? { ...item, [field]: value } : item));
  };

  const handleSubmit = async () => {
    if (!editingProfessional && creationLimitReached) {
      toast.error('Limite de profissionais do seu plano atingido. Faca upgrade para adicionar mais.');
      return;
    }
    if (linkCurrentUser && hasLinkedCurrentUserProfessional) {
      toast.error('Seu usuario ja esta vinculado a um profissional.');
      return;
    }
    if (!formName || !formEmail || !formPhone) {
      toast.error('Preencha todos os campos obrigatorios');
      return;
    }
    const invalidWorkingRange = formWorkingHours.some((item) => item.isWorking && item.startTime >= item.endTime);
    if (invalidWorkingRange) {
      toast.error('Revise os horarios: o inicio deve ser menor que o fim.');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: FormPayload = {
        name: formName, email: formEmail, phone: formPhone,
        specialties: selectedSpecialties, commissionRate: 0,
        isActive: formIsActive, workingHours: formWorkingHours,
        userId: linkCurrentUser ? user?.id : undefined,
        createUser: linkCurrentUser ? false : true,
      };
      if (editingProfessional) {
        await onUpdate(editingProfessional.id, payload);
      } else {
        await onCreate(payload);
      }
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeToggleSection = (
    <DialogSection className="flex flex-col gap-3 bg-transparent sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Label>Profissional Ativo</Label>
        <p className="text-xs text-muted-foreground">Disponivel para agendamentos</p>
      </div>
      <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
    </DialogSection>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
        O scroll fica no DialogBody, nao no DialogContent: o DialogStickyFooter
        usa position:sticky e, com o DialogContent em `grid` + overflow, o bloco
        conteiner do rodape vira a propria celula do grid (altura exata dele),
        sem espaco para grudar — o rodape acabava rolando no meio do conteudo.
      */}
      <DialogContent className="mx-4 flex max-h-[85vh] max-w-md flex-col overflow-hidden sm:mx-auto sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b border-border/70 pb-4 pr-10">
          <DialogTitle>{editingProfessional ? 'Editar Profissional' : 'Novo Profissional'}</DialogTitle>
          <DialogDescription>
            {editingProfessional ? 'Atualize os dados do profissional' : 'Adicione um novo membro a equipe'}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="min-h-0 flex-1 overflow-y-auto">
          <DialogSection>
            <p className="text-sm font-medium text-foreground">
              {editingProfessional ? 'Ajuste dados operacionais, especialidades e disponibilidade.' : 'Cadastre o profissional com os dados minimos para liberar agenda, especialidades e horarios.'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              E-mail, telefone e horario de trabalho ajudam a deixar o perfil pronto para operacao desde o primeiro acesso.
            </p>
            {!editingProfessional ? (
              <div className="mt-3 rounded-xl border border-emerald-200/70 bg-emerald-50/80 p-3 text-sm text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100">
                {linkCurrentUser
                  ? 'Este profissional vai usar o mesmo login da sua conta atual, mantendo as permissoes administrativas.'
                  : 'Ao salvar, o sistema cria o acesso do profissional automaticamente e envia uma senha temporaria para o e-mail informado.'}
              </div>
            ) : null}
          </DialogSection>

          <DialogSection className="bg-transparent">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Dados principais</p>
              <p className="text-sm text-muted-foreground">Identificacao e contato para liberar uso operacional e acesso do profissional.</p>
            </div>

            {canLinkCurrentUser ? (
              <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      Este usuario tambem atende clientes?
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Ative para vincular este profissional ao seu login atual sem perder as permissoes administrativas.
                    </p>
                  </div>
                  <Switch
                    checked={linkCurrentUser}
                    onCheckedChange={setLinkCurrentUser}
                    disabled={hasLinkedCurrentUserProfessional}
                  />
                </div>
                {hasLinkedCurrentUserProfessional ? (
                  <p className="mt-3 text-xs text-amber-700">
                    Seu usuario atual ja esta vinculado a um profissional.
                  </p>
                ) : linkCurrentUser ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    O profissional usara o mesmo e-mail e o mesmo login da sua conta atual.
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-2">
              <Label>Nome Completo *</Label>
              <Input
                placeholder="Nome do profissional"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>E-mail *</Label>
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  disabled={!!editingProfessional || linkCurrentUser}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone *</Label>
                <Input
                  placeholder="(11) 99999-0000"
                  value={formPhone}
                  onChange={(e) => setFormPhone(maskPhoneBr(e.target.value))}
                  disabled={!!editingProfessional}
                />
              </div>
            </div>
            {editingProfessional ? (
              <p className="text-xs text-muted-foreground">
                E-mail e telefone nao podem ser alterados na edicao do profissional.
              </p>
            ) : linkCurrentUser ? (
              <p className="text-xs text-muted-foreground">
                O e-mail fica travado porque sera compartilhado com o seu usuario atual.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Use um e-mail valido. Ele recebera a senha temporaria do primeiro acesso.
              </p>
            )}
          </DialogSection>

          <DialogSection className="bg-transparent">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Escopo de atuacao</p>
              <p className="text-sm text-muted-foreground">Defina onde esse profissional atua e quais servicos ele pode assumir.</p>
            </div>

            <div className="space-y-2">
              <Label>Especialidades</Label>
              {onCreateSpecialty ? (
                <div className="flex gap-2">
                  <Input
                    aria-label="Nova especialidade"
                    placeholder="Ex: Corte, Coloracao"
                    value={newSpecialty}
                    onChange={(e) => setNewSpecialty(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        void handleCreateSpecialty();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void handleCreateSpecialty()}
                    disabled={isCreatingSpecialty || !newSpecialty.trim()}
                  >
                    {isCreatingSpecialty ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar'}
                  </Button>
                </div>
              ) : null}
              <div className="max-h-48 space-y-3 overflow-y-auto rounded-xl border border-border/70 bg-background/80 p-3">
              {isLoadingSpecialties && <p className="text-sm text-muted-foreground">Carregando especialidades...</p>}
              {specialtiesError && (
                <div className="space-y-2">
                  <p className="text-sm text-red-600">{specialtiesError}</p>
                  <Button type="button" variant="outline" size="sm" onClick={refetchSpecialties}>
                    Tentar novamente
                  </Button>
                </div>
              )}
              {!isLoadingSpecialties && !specialtiesError && !specialties.length && (
                <p className="text-sm text-muted-foreground">Nenhuma especialidade cadastrada.</p>
              )}
              {!isLoadingSpecialties && specialties.map((specialty) => (
                <label key={specialty.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={selectedSpecialties.includes(specialty.name)}
                    onCheckedChange={() => toggleSpecialty(specialty.name)}
                  />
                  <span>{specialty.name}</span>
                </label>
              ))}
            </div>
            {selectedSpecialties.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedSpecialties.map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                ))}
              </div>
            )}
            </div>
          </DialogSection>

          <DialogSection className="bg-transparent">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Disponibilidade semanal</p>
              <p className="text-sm text-muted-foreground">Revise os dias ativos para evitar conflitos na agenda e nos encaixes operacionais.</p>
            </div>

            <div className="space-y-2">
              <Label>Horario de trabalho</Label>
              <div className="space-y-2 rounded-xl border border-border/70 bg-background/80 p-3">
              {formWorkingHours
                .slice()
                .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                .map((hour) => (
                  <div key={hour.dayOfWeek} className="grid grid-cols-1 items-center gap-2 rounded-xl border border-border/60 bg-muted/10 p-3 sm:grid-cols-[92px_1fr_1fr_auto]">
                    <span className="text-xs font-medium text-muted-foreground">{weekdayLabels[hour.dayOfWeek]}</span>
                    <Input
                      type="time"
                      value={hour.startTime}
                      onChange={(e) => updateWorkingHour(hour.dayOfWeek, 'startTime', e.target.value)}
                      disabled={isWorkingHoursDisabled || !hour.isWorking}
                    />
                    <Input
                      type="time"
                      value={hour.endTime}
                      onChange={(e) => updateWorkingHour(hour.dayOfWeek, 'endTime', e.target.value)}
                      disabled={isWorkingHoursDisabled || !hour.isWorking}
                    />
                    <Switch
                      checked={hour.isWorking}
                      onCheckedChange={(checked) => updateWorkingHour(hour.dayOfWeek, 'isWorking', checked)}
                      disabled={isWorkingHoursDisabled}
                    />
                  </div>
                ))}
            </div>
              {isWorkingHoursDisabled ? (
                <p className="text-xs text-amber-700">
                  Horarios de trabalho nao informados pelo backend. Edicao desativada.
                </p>
              ) : null}
            </div>
          </DialogSection>

          {advancedCollapsed ? (
            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="flex w-full items-center justify-between px-4 text-sm font-medium"
                >
                  Opcoes avancadas
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>{activeToggleSection}</CollapsibleContent>
            </Collapsible>
          ) : (
            activeToggleSection
          )}
        </DialogBody>
        <DialogStickyFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || (!editingProfessional && creationLimitReached)}
            title={!editingProfessional && creationLimitReached ? 'Limite de profissionais do seu plano atingido' : undefined}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {editingProfessional ? 'Salvando...' : 'Adicionando...'}
              </>
            ) : editingProfessional ? 'Salvar profissional' : 'Criar profissional'}
          </Button>
        </DialogStickyFooter>
      </DialogContent>
    </Dialog>
  );
}
