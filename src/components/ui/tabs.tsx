import * as React from "react";

interface TabsProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
  className?: string;
  children: React.ReactNode;
}

const TabsContext = React.createContext<{
  value?: string;
  onValueChange?: (v: string) => void;
}>({});

export function Tabs({ value, defaultValue, onValueChange, className = "", children }: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "");
  
  const currentValue = value !== undefined ? value : internalValue;
  const handleValueChange = React.useCallback((newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  }, [value, onValueChange]);

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`inline-grid bg-gray-100 rounded-md p-1 ${className}`}>{children}</div>
}

export function TabsTrigger({ value, children, className = "" }: { value: string; children: React.ReactNode; className?: string }) {
  const { value: currentValue, onValueChange } = React.useContext(TabsContext);
  const isActive = currentValue === value;
  
  return (
    <button 
      type="button" 
      onClick={() => onValueChange?.(value)} 
      className={`px-3 py-1.5 text-sm rounded transition-colors ${
        isActive 
          ? 'bg-white shadow-sm text-gray-900' 
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
      } ${className}`} 
      data-value={value}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value: _value, className = "", children }: { value: string; className?: string; children: React.ReactNode }) {
  return <div className={className}>{children}</div>
}
