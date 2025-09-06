import * as React from "react";

export function Select({ value, onValueChange, required, children }: { value?: string; onValueChange?: (v: string) => void; required?: boolean; children: React.ReactNode }) {
  return <div>{children}</div>
}

export function SelectTrigger({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`border rounded px-3 py-2 text-sm ${className}`}>{children}</div>
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  return <span className="text-gray-500">{placeholder}</span>
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  return <div className="border rounded mt-2 p-1 bg-white shadow">{children}</div>
}

export function SelectItem({ value, children, onSelect }: { value: string; children: React.ReactNode; onSelect?: (v: string) => void }) {
  return (
    <button type="button" className="block w-full text-left px-2 py-1 rounded hover:bg-gray-50" onClick={() => onSelect && onSelect(value)}>
      {children}
    </button>
  )
}
