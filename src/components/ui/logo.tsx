import * as React from "react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function Logo({ className }: { className?: string }) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className={cn("h-10 w-[140px]", className)} />
  }

  const isDark = resolvedTheme === 'dark'
  const logoSrc = isDark ? "/vistorify_logo_white.png" : "/vistorify_logo2_preto.jpg-removebg-preview.png"

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Image 
        src={logoSrc} 
        alt="Vistorify Logo" 
        width={180} 
        height={60} 
        className={cn("object-contain", isDark && "brightness-200")}
        style={{ height: 'auto' }}
        priority
      />
    </div>
  )
}
