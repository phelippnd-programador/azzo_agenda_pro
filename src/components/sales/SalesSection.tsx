import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SalesSectionProps {
  id?: string;
  className?: string;
  title?: string;
  subtitle?: string;
  children: ReactNode;
}

export function SalesSection({
  id,
  className,
  title,
  subtitle,
  children,
}: SalesSectionProps) {
  return (
    <section id={id} className={cn("py-12 md:py-16", className)}>
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        {title ? (
          <div className="mb-8 max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-3 text-sm md:text-base text-slate-600">{subtitle}</p>
            ) : null}
          </div>
        ) : null}
        {children}
      </div>
    </section>
  );
}
