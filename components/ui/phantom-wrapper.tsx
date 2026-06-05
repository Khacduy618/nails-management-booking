"use client"

import React, { useEffect, useState } from "react"
import "@aejkatappaja/phantom-ui/ssr.css"

interface PhantomWrapperProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
  loading?: boolean
  ignore?: boolean // data-shimmer-ignore
  noChildren?: boolean // data-shimmer-no-children
  shimmerWidth?: string // data-shimmer-width
  shimmerHeight?: string // data-shimmer-height
  [key: string]: any // Cho phép truyền bất kỳ thuộc tính tùy biến nào của phantom-ui
}

export default function PhantomWrapper({
  children,
  loading = false,
  ignore = false,
  noChildren = false,
  shimmerWidth,
  shimmerHeight,
  className,
  ...props
}: PhantomWrapperProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Dynamic import to prevent SSR reference errors (window is not defined)
    import("@aejkatappaja/phantom-ui")
      .then(() => {
        setMounted(true)
      })
      .catch((err) => {
        console.error("Failed to load @aejkatappaja/phantom-ui:", err)
      })
  }, [])

  // In Next.js, custom elements are rendered directly. 
  // Before hydration, ssr.css hides the content if loading is true.
  return (
    <phantom-ui
      loading={loading ? "" : undefined}
      data-shimmer-ignore={ignore ? "" : undefined}
      data-shimmer-no-children={noChildren ? "" : undefined}
      data-shimmer-width={shimmerWidth}
      data-shimmer-height={shimmerHeight}
      class={className}
      {...props}
    >
      {children}
    </phantom-ui>
  )
}
