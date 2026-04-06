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
      className={cn("py-12 md:py-16", className)}
    >
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        {title ? (
          <header className="mb-8 max-w-2xl">
            <HeadingTag
              id={headingId}
              className="text-2xl md:text-3xl font-bold tracking-tight text-foreground"
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

