import * as React from "react"
import { cn } from "../../../lib/cn"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-[#EDEAE4] bg-white px-3 py-2 text-sm",
          "text-[#061F2A] placeholder:text-[#B0A8A0]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D5C7A] focus-visible:border-[#0D5C7A]",
          "hover:border-[#C8E8EF] transition-colors",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
