import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Circle, Gem, Medal, Shield, Trophy } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type RankedBarCardItem = {
  id: string;
  name: string;
  value: number;
  badgeText?: string;
  metaText?: string;
};

type RankedBarCardProps = {
  title: string;
  icon: LucideIcon;
  subtitle?: ReactNode;
  items: RankedBarCardItem[];
  emptyMessage: string;
  maxItems?: number;
  valueLabel?: string;
  labelPrefix?: string;
  valueFormatter?: (value: number) => string;
};

const rankTiers = [
  {
    label: "Diamante",
    Icon: Gem,
    accentClass: "bg-cyan-50 text-cyan-700 border-cyan-200",
    iconClass: "text-cyan-600",
    tagClass: "bg-cyan-100 text-cyan-700",
  },
  {
    label: "Ouro",
    Icon: Trophy,
    accentClass: "bg-amber-50 text-amber-700 border-amber-200",
    iconClass: "text-amber-600",
    tagClass: "bg-amber-100 text-amber-700",
  },
  {
    label: "Prata",
    Icon: Medal,
    accentClass: "bg-slate-50 text-slate-700 border-slate-200",
    iconClass: "text-slate-500",
    tagClass: "bg-slate-200 text-slate-700",
  },
  {
    label: "Bronze",
    Icon: Shield,
    accentClass: "bg-orange-50 text-orange-700 border-orange-200",
    iconClass: "text-orange-600",
    tagClass: "bg-orange-100 text-orange-700",
  },
  {
    label: "Lata",
    Icon: Circle,
    accentClass: "bg-zinc-50 text-zinc-700 border-zinc-200",
    iconClass: "text-zinc-500",
    tagClass: "bg-zinc-200 text-zinc-700",
  },
] as const;

export function RankedBarCard({
  title,
  icon: Icon,
  subtitle,
  items,
  emptyMessage,
  maxItems = 5,
  valueLabel = "Valor",
  labelPrefix = "Item",
  valueFormatter,
}: RankedBarCardProps) {
  const visibleItems = items.slice(0, maxItems);
  const chartHeight = Math.max(240, visibleItems.length * 56);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-primary" />
          {title}
        </CardTitle>
        {subtitle ? <div className="text-sm text-muted-foreground">{subtitle}</div> : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleItems.length ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
            <div className="rounded-xl border bg-muted/20 p-4">
              <div style={{ height: chartHeight }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={visibleItems} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={110}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(15, 23, 42, 0.04)" }}
                      formatter={(value: number) => [
                        valueFormatter ? valueFormatter(Number(value || 0)) : `${value}`,
                        valueLabel,
                      ]}
                      labelFormatter={(label) => `${labelPrefix}: ${label}`}
                    />
                    <Bar dataKey="value" name={valueLabel} radius={[0, 8, 8, 0]} fill="hsl(var(--primary))" barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border bg-muted/20 p-3">
              <div className="space-y-2">
                {visibleItems.map((item, index) => {
                  const rank = rankTiers[index] ?? rankTiers[rankTiers.length - 1];
                  const RankIcon = rank.Icon;

                  return (
                    <div
                      key={item.id}
                      className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 rounded-lg bg-background/90 px-3 py-2"
                    >
                      <div className={`flex h-9 w-9 flex-col items-center justify-center rounded-full border ${rank.accentClass}`}>
                        <RankIcon className={`h-3.5 w-3.5 ${rank.iconClass}`} />
                        <span className="text-[10px] font-semibold leading-none">{index + 1}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium">{item.name}</p>
                          <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${rank.tagClass}`}>
                            {rank.label}
                          </span>
                        </div>
                        {item.metaText ? (
                          <p className="truncate text-xs text-muted-foreground">{item.metaText}</p>
                        ) : null}
                      </div>
                      {item.badgeText ? (
                        <Badge variant="secondary" className="h-6 px-2 text-[11px]">
                          {item.badgeText}
                        </Badge>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        )}
      </CardContent>
    </Card>
  );
}
