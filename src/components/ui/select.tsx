import * as React from "react";

const SelectContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  selectedLabel?: string;
  setSelectedLabel: (label: string) => void;
  disabled?: boolean;
}>({
  isOpen: false,
  setIsOpen: () => {},
  setSelectedLabel: () => {},
  disabled: false,
});

export function Select({ 
  value, 
  onValueChange, 
  required, 
  disabled = false,
  children 
}: { 
  value?: string; 
  onValueChange?: (v: string) => void; 
  required?: boolean; 
  disabled?: boolean;
  children: React.ReactNode 
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedLabel, setSelectedLabel] = React.useState<string>("");
  const selectRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <SelectContext.Provider value={{ 
      value, 
      onValueChange: disabled ? undefined : onValueChange, 
      isOpen: disabled ? false : isOpen, 
      setIsOpen: disabled ? () => {} : setIsOpen, 
      selectedLabel, 
      setSelectedLabel,
      disabled 
    }}>
      <div className="relative" ref={selectRef}>
        {children}
      </div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ 
  children, 
  className = "" 
}: { 
  children: React.ReactNode; 
  className?: string 
}) {
  const { isOpen, setIsOpen, disabled } = React.useContext(SelectContext);
  
  return (
    <button
      type="button"
      disabled={disabled}
      className={`border rounded px-3 py-2 text-sm w-full text-left flex items-center justify-between ${
        disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'hover:bg-gray-50'
      } ${className}`}
      onClick={() => !disabled && setIsOpen(!isOpen)}
    >
      {children}
      <svg
        className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const { selectedLabel } = React.useContext(SelectContext);
  return <span className={selectedLabel ? "text-gray-900" : "text-gray-500"}>{selectedLabel || placeholder}</span>;
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  const { isOpen } = React.useContext(SelectContext);
  
  if (!isOpen) return null;
  
  return (
    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
      {children}
    </div>
  );
}

export function SelectItem({ 
  value, 
  children, 
  onSelect 
}: { 
  value: string; 
  children: React.ReactNode; 
  onSelect?: (v: string) => void 
}) {
  const { onValueChange, setIsOpen, setSelectedLabel } = React.useContext(SelectContext);
  
  const handleClick = () => {
    if (onValueChange) {
      onValueChange(value);
    }
    if (onSelect) {
      onSelect(value);
    }
    // Store the text content for display
    setSelectedLabel(React.Children.toArray(children).join(""));
    setIsOpen(false);
  };

  return (
    <button 
      type="button" 
      className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
      onClick={handleClick}
    >
      {children}
    </button>
  );
}
