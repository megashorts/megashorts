import * as React from "react"

export function VisuallyHidden({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <span className="absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0">
      {children}
    </span>
  )
}
