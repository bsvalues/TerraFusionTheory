import * as React from "react";
import { cn } from "@/lib/utils";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full", className)}
        {...props}
      />
    );
  }
);

Spinner.displayName = "Spinner";