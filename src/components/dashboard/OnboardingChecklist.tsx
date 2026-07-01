import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, X, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { salonApi } from '@/lib/api/salon';
import { professionalsApi } from '@/lib/api/professionals';
import { servicesApi } from '@/lib/api';

const DISMISSED_KEY = 'azzo:onboarding:dismissed';

interface ChecklistItem {
  id: string;
  label: string;
  href: string;
  done: boolean;
}

interface OnboardingChecklistProps {
  tenantId?: string;
}

export function OnboardingChecklist({ tenantId }: OnboardingChecklistProps) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem(DISMISSED_KEY) === 'true',
  );
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [slug, setSlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (dismissed) return;

    let active = true;

    const load = async () => {
      try {
        const [profPage, servPage, profile] = await Promise.allSettled([
          professionalsApi.getAll({ page: 1, limit: 1 }),
          servicesApi.getAll({ page: 1, limit: 1 }),
          salonApi.getProfile(),
        ]);

        if (!active) return;

        const countFromResponse = (res: unknown): number => {
          if (Array.isArray(res)) return res.length;
          if (res && typeof res === 'object') {
            const r = res as Record<string, unknown>;
            if (typeof r.totalCount === 'number') return r.totalCount;
            if (typeof r.total === 'number') return r.total;
            if (Array.isArray(r.items)) return r.items.length;
          }
          return 0;
        };

        const hasProfessionals =
          profPage.status === 'fulfilled' && countFromResponse(profPage.value) > 0;
        const hasServices =
          servPage.status === 'fulfilled' && countFromResponse(servPage.value) > 0;

        let hasHours = false;
        let resolvedSlug: string | null = null;

        if (profile.status === 'fulfilled') {
          hasHours =
            Array.isArray(profile.value.businessHours) &&
            profile.value.businessHours.some((h) => h.enabled);
          resolvedSlug = profile.value.salonSlug ?? null;
        }

        setSlug(resolvedSlug);

        const next: ChecklistItem[] = [
          {
            id: 'professionals',
            label: 'Cadastre seus profissionais',
            href: '/profissionais',
            done: hasProfessionals,
          },
          {
            id: 'services',
            label: 'Cadastre seus serviços',
            href: '/servicos',
            done: hasServices,
          },
          {
            id: 'hours',
            label: 'Configure os horários de funcionamento',
            href: '/configuracoes/horarios',
            done: hasHours,
          },
          {
            id: 'link',
            label: 'Compartilhe seu link de agendamento',
            href: resolvedSlug ? `/agendar/${resolvedSlug}` : '/perfil-salao',
            done: false,
          },
        ];

        setItems(next);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void load();
    return () => { active = false; };
  }, [dismissed]);

  const allDone = items.length > 0 && items.every((i) => i.done);

  if (dismissed || (!isLoading && allDone)) return null;
  if (isLoading) return null;

  const completedCount = items.filter((i) => i.done).length;

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setDismissed(true);
  };

  const handleItemClick = (item: ChecklistItem) => {
    if (item.id === 'link' && slug) {
      window.open(`${window.location.origin}/agendar/${slug}`, '_blank');
      return;
    }
    navigate(item.href);
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Configure seu salão</CardTitle>
            <CardDescription className="mt-0.5">
              {completedCount} de {items.length} etapas concluídas
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={handleDismiss}
            aria-label="Dispensar checklist"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${(completedCount / items.length) * 100}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => handleItemClick(item)}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-primary/10"
              >
                {item.done ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className={item.done ? 'text-muted-foreground line-through' : 'text-foreground'}>
                  {item.label}
                </span>
                {item.id === 'link' && slug && (
                  <ExternalLink className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
