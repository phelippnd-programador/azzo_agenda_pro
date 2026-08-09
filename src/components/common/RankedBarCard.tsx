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

// Ranks se diferenciam por intensidade da cor primária (Regra da Voz Única),
// não por matizes distintos. A última posição usa neutro, não cinza cru.
const rankTiers = [
  {
    label: "Diamante",
    Icon: Gem,
    accentClass: "bg-primary/12 text-primary border-primary/30",
    iconClass: "text-primary",
    tagClass: "bg-primary/16 text-primary",
  },
  {
    label: "Ouro",
    Icon: Trophy,
    accentClass: "bg-primary/10 text-primary/90 border-primary/25",
    iconClass: "text-primary/90",
    tagClass: "bg-primary/14 text-primary/90",
  },
  {
    label: "Prata",
    Icon: Medal,
    accentClass: "bg-primary/8 text-primary/80 border-primary/20",
    iconClass: "text-primary/70",
    tagClass: "bg-primary/12 text-primary/80",
  },
  {
    label: "Bronze",
    Icon: Shield,
    accentClass: "bg-primary/6 text-primary/70 border-primary/15",
    iconClass: "text-primary/60",
    tagClass: "bg-primary/10 text-primary/70",
  },
  {
    label: "Base",
    Icon: Circle,
    accentClass: "bg-muted text-muted-foreground border-border/60",
    iconClass: "text-muted-foreground",
    tagClass: "bg-muted text-muted-foreground",
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
  const chartHeight = Math.max(160, visibleItems.length * 58);
  const shouldSplitLayout = visibleItems.length >= 4;
  const truncateChartLabel = (label: string) =>
    label.length > 22 ? `${label.slice(0, 22).trimEnd()}...` : label;

  return (
    <Card className="border-border/70 bg-background/95 shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        {subtitle ? <div className="text-sm text-muted-foreground">{subtitle}</div> : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleItems.length ? (
          <div
            className={`grid gap-4 ${
              shouldSplitLayout ? 'min-[1650px]:grid-cols-[minmax(0,1.7fr)_minmax(360px,1fr)]' : ''
            }`}
          >
            <div className="rounded-xl border border-border/70 bg-muted/15 p-4">
              <div style={{ height: chartHeight }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={visibleItems}
                    layout="vertical"
                    margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                  >
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={160}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12 }}
                      tickFormatter={truncateChartLabel}
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

            <div className="rounded-xl border border-border/70 bg-muted/15 p-3">
              <div className="space-y-2">
                {visibleItems.map((item, index) => {
                  const rank = rankTiers[index] ?? rankTiers[rankTiers.length - 1];
                  const RankIcon = rank.Icon;

                  return (
                    <div
                      key={item.id}
                      className="grid grid-cols-[36px_minmax(0,1fr)] gap-3 rounded-xl border border-border/70 bg-background/90 px-3 py-3 transition-colors hover:bg-muted/15"
                    >
                      <div className={`flex h-9 w-9 flex-col items-center justify-center rounded-full border ${rank.accentClass}`}>
                        <RankIcon className={`h-3.5 w-3.5 ${rank.iconClass}`} />
                        <span className="text-xs font-semibold leading-none">{index + 1}</span>
                      </div>
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="line-clamp-2 break-words text-sm font-medium text-foreground">{item.name}</p>
                            {item.metaText ? (
                              <p className="mt-1 line-clamp-2 break-words text-xs text-muted-foreground">{item.metaText}</p>
                            ) : null}
                          </div>
                          <span
                            className={`inline-flex flex-shrink-0 rounded-full px-2 py-1 text-xs font-medium ${rank.tagClass}`}
                          >
                            {rank.label}
                          </span>
                        </div>
                        {item.badgeText ? (
                          <div className="flex justify-end">
                            <Badge
                              variant="secondary"
                              className="max-w-full px-2.5 py-1 text-[11px] font-medium whitespace-normal break-words text-right"
                            >
                              {item.badgeText}
                            </Badge>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-background/80 px-4 py-8 text-center">
            <Icon className="mb-3 h-7 w-7 text-primary" />
            <p className="text-sm font-medium text-foreground">{emptyMessage}</p>
            <p className="mt-1 max-w-md text-xs text-muted-foreground">
              Assim que houver dados no período, o ranking aparecerá aqui.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
