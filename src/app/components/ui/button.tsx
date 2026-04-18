import * as React from "react"
import { cn } from "../../../lib/cn"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'theme'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all",
          "disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-[#0D5C7A] text-white hover:bg-[#1280A8]": variant === "default",
            "border border-[#EDEAE4] bg-white text-[#061F2A] hover:bg-[#E8F5F8] hover:text-[#0D5C7A] hover:border-[#C8E8EF]": variant === "outline",
            "text-[#061F2A] hover:bg-[#E8F5F8] hover:text-[#0D5C7A]": variant === "ghost",
            "bg-destructive text-destructive-foreground hover:bg-destructive/90": variant === "destructive",
            "bg-[var(--theme-accent)] text-[var(--theme-accent-foreground)] hover:bg-[#1280A8]": variant === "theme",
          },
          {
            "h-10 px-4 py-2 text-sm": size === "default",
            "h-9 px-3 text-sm": size === "sm",
            "h-11 px-8": size === "lg",
            "h-10 w-10 p-0": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
