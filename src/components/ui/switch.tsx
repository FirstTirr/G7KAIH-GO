
interface SwitchProps {
  id?: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

export function Switch({ 
  id, 
  checked, 
  onCheckedChange, 
  disabled = false, 
  className = "" 
}: SwitchProps) {
  const handleClick = () => {
    if (!disabled && onCheckedChange) {
      onCheckedChange(!checked)
    }
  }

  return (
    <button
      id={id}
      onClick={handleClick}
      disabled={disabled}
      className={`w-10 h-6 rounded-full transition-colors relative ${
        disabled 
          ? 'opacity-50 cursor-not-allowed bg-gray-200' 
          : checked 
            ? 'bg-emerald-500 hover:bg-emerald-600' 
            : 'bg-gray-300 hover:bg-gray-400'
      } ${className}`}
      type="button"
    >
      <span 
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-4' : ''
        }`} 
      />
    </button>
  )
}
