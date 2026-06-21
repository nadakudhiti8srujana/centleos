import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Lightbulb, ArrowRight, AlertCircle, TrendingUp, Clock, ShieldAlert } from "lucide-react";
import { api } from "@/lib/api";

interface Suggestion {
  type: string;
  title: string;
  description: string;
  action_url: string;
  priority: string;
}

export function AISuggestionsWidget() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSuggestions() {
      try {
        const res = await api.get<Suggestion[]>("/analytics/suggestions");
        setSuggestions(res.data);
      } catch (e) {
        console.error("Failed to fetch AI suggestions", e);
      } finally {
        setLoading(false);
      }
    }
    fetchSuggestions();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "follow_up": return <Clock className="w-5 h-5 text-amber-400" />;
      case "high_value": return <TrendingUp className="w-5 h-5 text-emerald-400" />;
      case "closing_soon": return <ShieldAlert className="w-5 h-5 text-rose-400" />;
      default: return <AlertCircle className="w-5 h-5 text-blue-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "medium": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      default: return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    }
  };

  if (loading) {
    return (
      <div className="glass-panel p-6 rounded-2xl border border-white/5 animate-pulse h-[300px]">
        <div className="h-6 w-48 bg-white/10 rounded mb-6"></div>
        <div className="space-y-4">
          <div className="h-20 bg-white/5 rounded-xl"></div>
          <div className="h-20 bg-white/5 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="glass-panel p-6 rounded-2xl border border-white/5 text-center h-[300px] flex flex-col items-center justify-center">
        <Lightbulb className="w-12 h-12 text-slate-500 mb-4 opacity-50" />
        <h3 className="text-lg font-medium text-slate-300">No Suggestions Yet</h3>
        <p className="text-sm text-slate-500 mt-2">Check back later for AI-driven recommendations based on your activity.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel flex flex-col overflow-hidden rounded-2xl shadow-elevated border border-white/5 relative h-[350px]">
      <div className="flex items-center gap-2 border-b border-white/5 px-6 py-5 bg-white/[0.02] relative z-10 shrink-0">
        <Lightbulb className="h-5 w-5 text-amber-400" />
        <h3 className="font-semibold text-white tracking-tight">AI Suggestions</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4 relative z-10 scrollbar-thin">
        {suggestions.map((sug, idx) => (
          <Link
            key={idx}
            to={sug.action_url}
            className="block p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-brand-500/30 transition-all duration-300 group"
          >
            <div className="flex items-start gap-4">
              <div className="shrink-0 p-2 rounded-lg bg-slate-900/50 border border-white/5">
                {getIcon(sug.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="font-semibold text-sm text-slate-200 group-hover:text-brand-300 transition-colors truncate">
                    {sug.title}
                  </h4>
                  <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getPriorityColor(sug.priority)}`}>
                    {sug.priority}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {sug.description}
                </p>
                <div className="mt-2 flex items-center text-[10px] font-semibold text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Take Action <ArrowRight className="w-3 h-3 ml-1" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
