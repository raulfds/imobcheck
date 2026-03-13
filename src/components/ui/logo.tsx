import * as React from "react"
import { cn } from "@/lib/utils"

export function VCheckIcon({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="currentColor"
      className={cn("text-primary", className)}
      {...props}
    >
      <path d="M2.5 14.5 L11 26 L29.5 5 L24.5 1.5 L10 18 L6.5 13 Z" />
    </svg>
  )
}

export function Logo({ className, showText = true, textClassName }: { className?: string, showText?: boolean, textClassName?: string }) {
  return (
    <div className={cn("flex items-center gap-2 tracking-tight", className)}>
      <VCheckIcon className="h-6 w-6" />
      {showText && <span className={cn("text-xl font-bold font-sans", textClassName)}>Vistorify</span>}
    </div>
  )
}
