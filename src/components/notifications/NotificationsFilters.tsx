import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { NotificationStatus, NotificationsFilters as FiltersType } from "@/types/notification";

const CHANNEL_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "APPOINTMENT_CREATED", label: "Agendamento criado" },
  { value: "WHATSAPP_REMINDER", label: "Lembrete WhatsApp" },
  { value: "WHATSAPP_CONFIG_ALERT", label: "Alerta configuracao WhatsApp" },
  { value: "WHATSAPP_DELIVERY_ERROR", label: "Falha de entrega WhatsApp" },
];

type NotificationsFiltersProps = {
  filters: FiltersType;
  onChange: (filters: FiltersType) => void;
  onApply: () => void | Promise<void>;
  isApplying?: boolean;
};

export function NotificationsFilters({
  filters,
  onChange,
  onApply,
  isApplying = false,
}: NotificationsFiltersProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
      <div className="space-y-1">
        <Label htmlFor="notifications-status">Status</Label>
        <Select
          value={filters.status || "all"}
          onValueChange={(value) =>
            onChange({
              ...filters,
              status: (value === "all" ? undefined : value) as NotificationStatus | undefined,
            })
          }
        >
          <SelectTrigger id="notifications-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="FAILED">FAILED</SelectItem>
            <SelectItem value="SENT">SENT</SelectItem>
            <SelectItem value="PENDING">PENDING</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="notifications-channel">Canal</Label>
        <Select
          value={filters.channel || "all"}
          onValueChange={(value) =>
            onChange({
              ...filters,
              channel: value === "all" ? undefined : value,
            })
          }
        >
          <SelectTrigger id="notifications-channel">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {CHANNEL_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="notifications-limit">Limite</Label>
        <Input
          id="notifications-limit"
          type="number"
          min={1}
          max={500}
          value={filters.limit ?? 100}
          onChange={(event) => {
            const parsed = Number(event.target.value || 100);
            const next = Math.min(Math.max(parsed, 1), 500);
            onChange({
              ...filters,
              limit: next,
            });
          }}
        />
      </div>

      <div className="flex items-end">
        <div className="flex items-center justify-between rounded-md border border-input h-10 px-3 w-full">
          <Label htmlFor="notifications-failed-only" className="text-sm">
            Somente falhas
          </Label>
          <Switch
            id="notifications-failed-only"
            checked={Boolean(filters.failedOnly)}
            onCheckedChange={(checked) =>
              onChange({
                ...filters,
                failedOnly: checked,
              })
            }
          />
        </div>
      </div>

      <div className="flex items-end">
        <div className="flex items-center justify-between rounded-md border border-input h-10 px-3 w-full">
          <Label htmlFor="notifications-unread-only" className="text-sm">
            Nao visualizadas
          </Label>
          <Switch
            id="notifications-unread-only"
            checked={Boolean(filters.unreadOnly)}
            onCheckedChange={(checked) =>
              onChange({
                ...filters,
                unreadOnly: checked,
              })
            }
          />
        </div>
      </div>

      <div className="flex items-end">
        <Button
          type="button"
          className="w-full"
          onClick={onApply}
          isLoading={isApplying}
          loadingText="Aplicando..."
        >
          Aplicar filtros
        </Button>
      </div>
    </div>
  );
}
