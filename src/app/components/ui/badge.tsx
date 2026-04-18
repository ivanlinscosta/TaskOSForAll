import * as React from "react"
import { cn } from "../../../lib/cn"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "theme"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        {
          "border-[#C2D8DE] bg-[#EBF2F5] text-[#0D5C7A]": variant === "default",
          "border-[#EDEAE4] bg-[#F4F3EF] text-[#7A7068]": variant === "secondary",
          "border-transparent bg-destructive text-destructive-foreground": variant === "destructive",
          "border-[#EDEAE4] bg-transparent text-[#061F2A]": variant === "outline",
          "border-transparent bg-[var(--theme-accent)] text-[var(--theme-accent-foreground)]": variant === "theme",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
