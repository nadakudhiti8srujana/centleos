import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { InputHTMLAttributes, forwardRef } from "react";

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onSearch, ...props }, ref) => (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        ref={ref}
        className={cn(
          "w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white transition-all",
          "placeholder:text-slate-500 focus:bg-white/10 focus:border-brand-500/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20",
          className
        )}
        onChange={(e) => onSearch?.(e.target.value)}
        {...props}
      />
    </div>
  )
);
SearchInput.displayName = "SearchInput";
