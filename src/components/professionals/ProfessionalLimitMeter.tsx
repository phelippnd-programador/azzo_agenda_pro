import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";
import type { ProfessionalLimits } from "@/lib/api";

interface ProfessionalLimitMeterProps {
  limits: ProfessionalLimits | null;
  isLoading?: boolean;
}

export function ProfessionalLimitMeter({
  limits,
  isLoading = false,
}: ProfessionalLimitMeterProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 sm:p-5 space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-full" />
          <div className="flex justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!limits) return null;

  const max = Math.max(limits.maxProfessionals || 0, 1);
  const used = Math.max(limits.currentProfessionals || 0, 0);
  const remaining = Math.max(limits.remaining || 0, 0);
  const percent = Math.min(Math.round((used / max) * 100), 100);
  const nearLimit = remaining <= 2;

  return (
    <Card className={nearLimit ? "border-amber-300 bg-amber-50/30" : ""}>
      <CardContent className="p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-gray-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-violet-600" />
            Limite de Profissionais
          </p>
          <span className="text-xs text-gray-600">
            {used}/{limits.maxProfessionals}
          </span>
        </div>

        <Progress value={percent} className="h-2.5" />

        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>{percent}% utilizado</span>
          <span>{remaining} disponiveis</span>
        </div>
      </CardContent>
    </Card>
  );
}
