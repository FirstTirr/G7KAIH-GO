import * as React from "react"

export function Badge({ className = "", variant = "default", ...props }: React.HTMLAttributes<HTMLSpanElement> & { variant?: "default" | "secondary" | "outline" }) {
  const v =
    variant === "secondary"
      ? "bg-gray-100 text-gray-700 border"
      : variant === "outline"
      ? "border"
      : "bg-gray-800 text-white"
  return <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded ${v} ${className}`} {...props} />
}
