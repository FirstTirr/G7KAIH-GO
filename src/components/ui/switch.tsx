
export function Switch({ id, checked, onCheckedChange }: { id?: string; checked?: boolean; onCheckedChange?: (c: boolean) => void }) {
  return (
    <button
      id={id}
      onClick={() => onCheckedChange && onCheckedChange(!checked)}
      className={`w-10 h-6 rounded-full transition-colors ${checked ? "bg-emerald-500" : "bg-gray-300"} relative`}
      type="button"
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${checked ? "translate-x-4" : ""}`} />
    </button>
  )
}
