import * as React from "react";

const SelectContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  selectedLabel?: string;
  setSelectedLabel: (label: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  disabled?: boolean;
}>({
  isOpen: false,
  setIsOpen: () => {},
  setSelectedLabel: () => {},
  searchTerm: "",
  setSearchTerm: () => {},
});

export function Select({ 
  value, 
  onValueChange, 
  required,
  disabled,
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
  const [searchTerm, setSearchTerm] = React.useState<string>("");
  const selectRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm(""); // Clear search when closing
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Clear search term when dropdown closes
  React.useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
    }
  }, [isOpen]);

  return (
    <SelectContext.Provider value={{ 
      value, 
      onValueChange, 
      isOpen, 
      setIsOpen, 
      selectedLabel, 
      setSelectedLabel,
      searchTerm,
      setSearchTerm,
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
      className={`border rounded px-3 py-2 text-sm w-full text-left flex items-center justify-between hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300 ${className}`}
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

export function SelectContent({ 
  children,
  searchable = false,
  searchPlaceholder = "Cari..."
}: { 
  children: React.ReactNode;
  searchable?: boolean;
  searchPlaceholder?: string;
}) {
  const { isOpen, searchTerm, setSearchTerm } = React.useContext(SelectContext);
  
  if (!isOpen) return null;
  
  return (
    <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg">
      {searchable && (
        <div className="p-2 border-b">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      <div className="max-h-60 overflow-auto">
        {children}
      </div>
    </div>
  );
}

export function SelectItem({ 
  value, 
  children, 
  onSelect,
  searchableText = "",
  className = ""
}: { 
  value: string; 
  children: React.ReactNode; 
  onSelect?: (v: string) => void;
  searchableText?: string;
  className?: string;
}) {
  const { onValueChange, setIsOpen, setSelectedLabel, searchTerm } = React.useContext(SelectContext);
  
  // Filter items based on search term
  const textContent = searchableText || React.Children.toArray(children).join("");
  const shouldShow = !searchTerm || textContent.toLowerCase().includes(searchTerm.toLowerCase());
  
  if (!shouldShow) return null;
  
  const handleClick = () => {
    if (onValueChange) {
      onValueChange(value);
    }
    if (onSelect) {
      onSelect(value);
    }
    // Store the text content for display
    setSelectedLabel(textContent);
    setIsOpen(false);
  };

  return (
    <button 
      type="button" 
      className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors ${className}`}
      onClick={handleClick}
    >
      {children}
    </button>
  );
}

export function SelectSeparator() {
  return <div className="border-t my-1" />;
}

export function SelectEmpty({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 py-2 text-sm text-gray-500 text-center">
      {children}
    </div>
  );
}
