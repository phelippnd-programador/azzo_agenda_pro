import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, UserCheck, UserX, X } from 'lucide-react';
import { toast } from 'sonner';
import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { appointmentsApi } from '@/lib/api/appointments';
import type { PendingAttendanceAppointment } from '@/lib/api/appointments';
import { resolveUiError } from '@/lib/error-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/agendar'];
const POLLING_INTERVAL_MS = 3 * 60 * 1000; // 3 minutos
const SNOOZE_DURATION_MS = 10 * 60 * 1000; // 10 minutos
const SNOOZE_KEY = 'attendance_confirmation_snoozed_until';

function isSnoozed(): boolean {
  try {
    const value = sessionStorage.getItem(SNOOZE_KEY);
    if (!value) return false;
    return Date.now() < Number(value);
  } catch {
    return false;
  }
}

function snooze(): void {
  try {
    sessionStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_DURATION_MS));
  } catch {
    // sessionStorage indisponivel — ignora
  }
}

function buildAppointmentDateTime(apt: PendingAttendanceAppointment): Date {
  const [h, m] = apt.startTime.split(':').map(Number);
  return new Date(
    `${apt.date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`,
  );
}

interface AttendanceConfirmationProviderProps {
  children: ReactNode;
}

export function AttendanceConfirmationProvider({
  children,
}: AttendanceConfirmationProviderProps) {
  const { user, isAuthenticated } = useAuth();
  const { pathname } = useLocation();
  const [queue, setQueue] = useState<PendingAttendanceAppointment[]>([]);
  const [isActing, setIsActing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isPublicRoute = PUBLIC_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + '/'),
  );

  const canPoll =
    isAuthenticated &&
    !isPublicRoute &&
    !!user &&
    ['OWNER', 'ADMIN', 'PROFESSIONAL'].includes(user.role);

  const fetchPending = useCallback(async () => {
    if (isSnoozed()) return;
    try {
      const data = await appointmentsApi.getPendingAttendanceConfirmation();
      if (data.length > 0) {
        setQueue((previous) => {
          const existingIds = new Set(previous.map((a) => a.id));
          const merged = [...previous];
          for (const apt of data) {
            if (!existingIds.has(apt.id)) merged.push(apt);
          }
          return merged;
        });
      }
    } catch {
      // Falha silenciosa — nao interrompe o usuario
    }
  }, []);

  useEffect(() => {
    if (!canPoll) {
      setQueue([]);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    void fetchPending();
    intervalRef.current = setInterval(() => {
      void fetchPending();
    }, POLLING_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [canPoll, fetchPending]);

  const current = queue[0] ?? null;

  const removeFromQueue = (id: string) => {
    setQueue((previous) => previous.filter((a) => a.id !== id));
  };

  const handleAttend = async (attended: boolean) => {
    if (!current) return;
    setIsActing(true);
    try {
      await appointmentsApi.markAttendance(current.id, attended);
      toast.success(
        attended
          ? `${current.clientName} marcado como presente.`
          : `${current.clientName} marcado como nao compareceu.`,
      );
      removeFromQueue(current.id);
    } catch (error) {
      toast.error(
        resolveUiError(error, 'Nao foi possivel registrar a presenca.').message,
      );
    } finally {
      setIsActing(false);
    }
  };

  const handleSnooze = () => {
    snooze();
    setQueue([]);
  };

  const handleDismiss = () => {
    if (current) removeFromQueue(current.id);
  };

  return (
    <>
      {children}

      {current && !isSnoozed() ? (
        <div className="fixed bottom-6 right-6 z-50 w-[380px]">
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Confirmacao de presenca</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground"
                onClick={handleDismiss}
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>

            <CardContent className="px-4 pb-3 pt-2 space-y-3">
              <div>
                <p className="font-semibold text-base leading-tight">
                  {current.clientName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {current.serviceNames.join(', ')} &bull; com {current.professionalName}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {(() => {
                    const aptDate = buildAppointmentDateTime(current);
                    return `Horario: ${current.startTime} — ${formatDistanceToNow(aptDate, { addSuffix: true, locale: ptBR })}`;
                  })()}
                </p>
              </div>

              <p className="text-sm">O cliente compareceu?</p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30"
                  disabled={isActing}
                  onClick={() => void handleAttend(true)}
                >
                  <UserCheck className="mr-1.5 h-4 w-4" />
                  Sim, compareceu
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
                  disabled={isActing}
                  onClick={() => void handleAttend(false)}
                >
                  <UserX className="mr-1.5 h-4 w-4" />
                  Nao compareceu
                </Button>
              </div>
            </CardContent>

            {queue.length > 0 ? (
              <>
                <Separator />
                <CardFooter className="flex items-center justify-between px-4 py-2">
                  <span className="text-xs text-muted-foreground">
                    {queue.indexOf(current) + 1} de {queue.length} pendente
                    {queue.length > 1 ? 's' : ''}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                    onClick={handleSnooze}
                  >
                    Lembrar em 10 min
                  </Button>
                </CardFooter>
              </>
            ) : null}
          </Card>
        </div>
      ) : null}
    </>
  );
}
