import * as React from "react";
import { CalendarDays } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const DateInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type: _type, ...props }, ref) => {
    return (
      <div className="relative">
        <Input ref={ref} type="date" className={cn("date-picker-input pr-11", className)} {...props} />
        <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground" />
      </div>
    );
  },
);

DateInput.displayName = "DateInput";

export { DateInput };
