import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectProps {
  label?: string;
  error?: string;
  id?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  value?: string;
  onChange?: (e: { target: { value: string; name?: string } }) => void;
  className?: string;
  name?: string;
  required?: boolean;
}

export const Select = ({
  className,
  label,
  error,
  id,
  options,
  placeholder = "Select an option...",
  value,
  onChange,
  name,
  required,
}: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (selectedValue: string) => {
    setIsOpen(false);
    if (onChange) {
      // Simulate standard event object for compatibility with existing onChange handlers
      onChange({ target: { value: selectedValue, name } });
    }
  };

  return (
    <div className="space-y-1.5" ref={containerRef}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-300">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Hidden Native Select for Form Submission Compatibility (Optional, but good for native forms) */}
      <select
        id={id}
        name={name}
        value={value}
        onChange={(e) => handleSelect(e.target.value)}
        className="hidden"
        required={required}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-left transition-all",
            "focus:bg-white/10 focus:border-brand-500/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20",
            isOpen ? "bg-white/10 border-brand-500/50" : "hover:bg-white/10",
            error && "border-red-500/50",
            className
          )}
        >
          <span className={cn("block truncate", !selectedOption && "text-slate-400")}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute z-50 mt-2 w-full rounded-xl border border-white/10 bg-[#0B1120] py-1 shadow-elevated backdrop-blur-xl"
            >
              <div className="max-h-60 overflow-auto scrollbar-thin">
                {options.length === 0 ? (
                  <div className="px-3 py-3 text-sm text-slate-500 text-center">
                    No options available
                  </div>
                ) : (
                  options.map((option) => {
                    const isSelected = option.value === value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleSelect(option.value)}
                        className={cn(
                          "relative flex w-full items-center justify-between px-3 py-2.5 text-sm text-left transition-colors",
                          "hover:bg-white/5 hover:text-white",
                          isSelected ? "bg-brand-500/10 text-brand-400 font-medium" : "text-slate-300"
                        )}
                      >
                        <span className="block truncate">{option.label}</span>
                        {isSelected && <Check className="h-4 w-4 shrink-0 text-brand-400" />}
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
};
