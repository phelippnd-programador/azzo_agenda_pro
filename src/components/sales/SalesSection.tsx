import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SalesSectionProps {
  id?: string;
  className?: string;
  title?: string;
  subtitle?: string;
  titleAs?: "h1" | "h2" | "h3";
  children: ReactNode;
}

export function SalesSection({
  id,
  className,
  title,
  subtitle,
  titleAs = "h2",
  children,
}: SalesSectionProps) {
  const headingId = title && id ? `${id}-title` : undefined;
  const HeadingTag = titleAs;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn("py-10 md:py-16", className)}
    >
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        {title ? (
          <header className="mb-6 max-w-2xl md:mb-8">
            <p className="section-eyebrow mb-3">Azzo Agenda Pro</p>
            <HeadingTag
              id={headingId}
              className="font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl"
            >
              {title}
            </HeadingTag>
            {subtitle ? (
              <p className="mt-3 text-sm md:text-base text-muted-foreground">{subtitle}</p>
            ) : null}
          </header>
        ) : null}
        {children}
      </div>
    </section>
  );
}

