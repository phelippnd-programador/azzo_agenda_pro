import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { NotificationStatus, NotificationsFilters as FiltersType } from "@/types/notification";

type NotificationsFiltersProps = {
  filters: FiltersType;
  onChange: (filters: FiltersType) => void;
  onApply: () => void;
};

export function NotificationsFilters({
  filters,
  onChange,
  onApply,
}: NotificationsFiltersProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
      <div className="space-y-1">
        <Label htmlFor="notifications-status">Status</Label>
        <select
          id="notifications-status"
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={filters.status || ""}
          onChange={(event) =>
            onChange({
              ...filters,
              status: (event.target.value || undefined) as NotificationStatus | undefined,
            })
          }
        >
          <option value="">Todos</option>
          <option value="FAILED">FAILED</option>
          <option value="SENT">SENT</option>
          <option value="PENDING">PENDING</option>
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="notifications-channel">Canal</Label>
        <Input
          id="notifications-channel"
          placeholder="WHATSAPP_CONFIG_ALERT"
          value={filters.channel || ""}
          onChange={(event) =>
            onChange({
              ...filters,
              channel: event.target.value || undefined,
            })
          }
        />
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
        <Button className="w-full" onClick={onApply}>
          Aplicar filtros
        </Button>
      </div>
    </div>
  );
}
