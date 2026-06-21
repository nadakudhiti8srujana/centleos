import { useEffect, useState } from "react";
import { Globe } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";

export function AuditLogsPage() {
  const { isSuperAdmin } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGlobal, setIsGlobal] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchLogs(1, isGlobal);
  }, [isGlobal]);

  const fetchLogs = async (pageNum: number, globalMode: boolean) => {
    setIsLoading(true);
    try {
      const endpoint = globalMode ? `/audit-logs/global` : `/audit-logs`;
      const res = await api.get(`${endpoint}?page=${pageNum}&page_size=50`);
      setLogs(res.data.items || []);
      setTotal(res.data.total || 0);
      setPage(res.data.page || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes("create")) return "text-green-600 bg-green-50";
    if (action.includes("update") || action.includes("change")) return "text-blue-600 bg-blue-50";
    if (action.includes("delete")) return "text-red-600 bg-red-50";
    if (action.includes("login") || action.includes("logout")) return "text-purple-600 bg-purple-50";
    return "text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">System Audit Logs</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Immutable ledger of system events and activities.</p>
        </div>
        <div className="flex items-center gap-3">
          {isSuperAdmin && (
            <Button 
              variant={isGlobal ? "primary" : "outline"} 
              onClick={() => setIsGlobal(!isGlobal)}
              className="gap-2"
            >
              <Globe className="h-4 w-4" />
              Global View
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-950 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3 font-medium text-slate-600 dark:text-slate-400">Timestamp</th>
                  {isGlobal && <th className="px-6 py-3 font-medium text-slate-600 dark:text-slate-400">Company ID</th>}
                  <th className="px-6 py-3 font-medium text-slate-600 dark:text-slate-400">User ID</th>
                  <th className="px-6 py-3 font-medium text-slate-600 dark:text-slate-400">Action</th>
                  <th className="px-6 py-3 font-medium text-slate-600 dark:text-slate-400">Entity</th>
                  <th className="px-6 py-3 font-medium text-slate-600 dark:text-slate-400">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-900/50">
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    {isGlobal && (
                      <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                        {log.company_id.substring(0, 8)}...
                      </td>
                    )}
                    <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                      {log.user_id ? `${log.user_id.substring(0, 8)}...` : "System"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{log.entity_type}</span>
                      {log.entity_id && (
                        <span className="text-slate-400 font-mono text-xs ml-2">({log.entity_id.substring(0,8)}...)</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs truncate text-xs text-slate-500 dark:text-slate-400 font-mono" title={JSON.stringify(log.details)}>
                        {JSON.stringify(log.details)}
                      </div>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={isGlobal ? 6 : 5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      No audit logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {total > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 text-sm">
            <span className="text-slate-500 dark:text-slate-400">Showing page {page}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => fetchLogs(page - 1, isGlobal)} disabled={page === 1}>Previous</Button>
              <Button variant="outline" size="sm" onClick={() => fetchLogs(page + 1, isGlobal)} disabled={logs.length < 50}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
