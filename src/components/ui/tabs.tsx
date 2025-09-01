import * as React from "react";

export function Tabs({ value, onValueChange, className = "", children }: { value: string; onValueChange: (v: string) => void; className?: string; children: React.ReactNode }) {
  return <div className={className}>{children}</div>
}

export function TabsList({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`inline-grid bg-gray-100 rounded-md p-1 ${className}`}>{children}</div>
}

export function TabsTrigger({ value, children, className = "", onClick }: { value: string; children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`px-3 py-1.5 text-sm rounded ${className}`} data-value={value}>
      {children}
    </button>
  )
}

export function TabsContent({ value: _value, className = "", children }: { value: string; className?: string; children: React.ReactNode }) {
  return <div className={className}>{children}</div>
}
