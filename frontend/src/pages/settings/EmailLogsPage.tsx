import { useEffect, useState } from "react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { Mail, RefreshCw, AlertCircle, CheckCircle, Clock } from "lucide-react";

import { api, getErrorMessage } from "@/lib/api";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { PageLoader } from "@/components/ui/Spinner";

export function EmailLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [retrying, setRetrying] = useState<string | null>(null);

  const fetchLogs = async (pageNum = 1) => {
    try {
      setLoading(true);
      const { data } = await api.get(`/email-logs?page=${pageNum}&page_size=20`);
      setLogs(data.items);
      setTotalPages(data.total_pages);
      setPage(data.page);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page);
  }, [page]);

  const handleRetry = async (logId: string) => {
    try {
      setRetrying(logId);
      await api.post(`/email-logs/${logId}/retry`);
      toast.success("Email retry triggered successfully.");
      await fetchLogs(page);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRetrying(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SENT":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"><CheckCircle className="w-3 h-3" /> Sent</span>;
      case "FAILED":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"><AlertCircle className="w-3 h-3" /> Failed</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"><Clock className="w-3 h-3" /> Pending</span>;
    }
  };

  return (
    <>
      <Header title="Email Logs" subtitle="Track and manage outgoing system emails" />
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900/50">
        <Card className="p-0 overflow-hidden">
          {loading && logs.length === 0 ? (
            <div className="py-12"><PageLoader /></div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Mail className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>No email logs found in this workspace.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Recipient</th>
                    <th className="px-6 py-4">Subject</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Sent At</th>
                    <th className="px-6 py-4">Error</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="px-6 py-4 text-slate-900 dark:text-slate-100 font-medium">
                        {log.recipient}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {log.subject}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(log.status)}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                        {log.sent_at ? format(new Date(log.sent_at), 'MMM d, yyyy HH:mm') : '-'}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs truncate max-w-[200px]" title={log.error_message || ''}>
                        {log.error_message || '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {log.status === "FAILED" && (
                          <button
                            onClick={() => handleRetry(log.id)}
                            disabled={retrying === log.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors disabled:opacity-50"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${retrying === log.id ? 'animate-spin' : ''}`} />
                            Retry
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    Page {page} of {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(p => p - 1)}
                      className="px-3 py-1 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-300"
                    >
                      Previous
                    </button>
                    <button
                      disabled={page === totalPages}
                      onClick={() => setPage(p => p + 1)}
                      className="px-3 py-1 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-300"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
