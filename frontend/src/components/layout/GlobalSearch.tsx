import { useState, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/Input";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ leads: any[]; contacts: any[]; deals: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      const fetchResults = async () => {
        setIsLoading(true);
        try {
          const { data } = await api.get(`/search?q=${encodeURIComponent(debouncedQuery)}`);
          setResults(data);
          setIsOpen(true);
        } catch (error) {
          console.error("Search error", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchResults();
    } else {
      setResults(null);
      setIsOpen(false);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleResultClick = (type: string, id: string) => {
    setIsOpen(false);
    setQuery("");
    navigate(`/${type}s/${id}`); // Assumes /leads/:id, /contacts/:id, /deals/:id
  };

  return (
    <div className="relative w-64 md:w-80" ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-2.5 top-[10px] h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search leads, contacts..."
          className="pl-9 h-9 text-sm border-none focus:ring-2 focus:ring-brand-500"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results) setIsOpen(true);
          }}
        />
        {isLoading && (
          <Loader2 className="absolute right-2.5 top-[10px] h-4 w-4 text-slate-400 animate-spin" />
        )}
      </div>

      {isOpen && results && (
        <div className="absolute top-11 left-0 w-full md:w-96 glass-panel border border-white/10 rounded-lg shadow-glow-super overflow-hidden z-50">
          <div className="max-h-[70vh] overflow-y-auto p-2 custom-scrollbar">
            {results.leads.length === 0 && results.contacts.length === 0 && results.deals.length === 0 && (
              <div className="p-4 text-sm text-center text-slate-400">No results found for "{query}"</div>
            )}

            {results.leads.length > 0 && (
              <div className="mb-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 py-1">Leads</h4>
                {results.leads.map((item: any) => (
                  <button
                    key={item.id}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 rounded-md transition-colors"
                    onClick={() => handleResultClick("lead", item.id)}
                  >
                    <div className="font-medium text-white">{item.title}</div>
                    <div className="text-xs text-slate-400">{item.subtitle}</div>
                  </button>
                ))}
              </div>
            )}

            {results.contacts.length > 0 && (
              <div className="mb-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 py-1">Contacts</h4>
                {results.contacts.map((item: any) => (
                  <button
                    key={item.id}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 rounded-md transition-colors"
                    onClick={() => handleResultClick("contact", item.id)}
                  >
                    <div className="font-medium text-white">{item.title}</div>
                    <div className="text-xs text-slate-400">{item.subtitle}</div>
                  </button>
                ))}
              </div>
            )}

            {results.deals.length > 0 && (
              <div className="mb-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 py-1">Deals</h4>
                {results.deals.map((item: any) => (
                  <button
                    key={item.id}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 rounded-md transition-colors"
                    onClick={() => handleResultClick("deal", item.id)}
                  >
                    <div className="font-medium text-white">{item.title}</div>
                    <div className="text-xs text-slate-400">{item.subtitle}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
