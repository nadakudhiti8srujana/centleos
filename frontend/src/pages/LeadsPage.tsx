import { Header } from "@/components/layout/Header";
import { LeadFormModal } from "@/components/leads/LeadFormModal";
import { SourceBadge, StageBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/Spinner";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Select";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate } from "@/lib/utils";
import { leadsService } from "@/services/leads";
import type { Lead, LeadSource, LeadStage } from "@/types";
import { LEAD_SOURCES, LEAD_STAGES, SOURCE_LABELS, STAGE_LABELS } from "@/types";
import { ChevronLeft, ChevronRight, Plus, Trash2, Download } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";

export function LeadsPage() {
  const { isSuperAdmin, workspaceId } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<LeadStage | "">("");
  const [sourceFilter, setSourceFilter] = useState<LeadSource | "">("");
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    if (isSuperAdmin && !workspaceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = search
        ? await leadsService.search(search, page)
        : await leadsService.list({
            page,
            page_size: 15,
            stage: stageFilter || undefined,
            source: sourceFilter || undefined,
          });
      setLeads(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } finally {
      setLoading(false);
    }
  }, [page, search, stageFilter, sourceFilter, workspaceId, isSuperAdmin]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const handleCreate = async (data: Parameters<typeof leadsService.create>[0]) => {
    await leadsService.create(data);
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await leadsService.delete(deleteId);
      toast.success("Lead deleted successfully");
      load();
    } catch (e) {
      toast.error("Failed to delete lead");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await leadsService.export();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "leads.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export failed", error);
      alert("Export failed. Please try again.");
    }
  };

  return (
    <>
      <Header
        title="Leads"
        subtitle={`${total} total leads`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" />
              New Lead
            </Button>
          </div>
        }
      />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-4 flex flex-wrap gap-3">
          <SearchInput
            placeholder="Search leads..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-64"
          />
          <Select
            options={[
              { value: "", label: "All stages" },
              ...LEAD_STAGES.map((s) => ({ value: s, label: STAGE_LABELS[s] })),
            ]}
            value={stageFilter}
            onChange={(e) => {
              setStageFilter(e.target.value as LeadStage | "");
              setPage(1);
            }}
            className="w-40"
          />
          <Select
            options={[
              { value: "", label: "All sources" },
              ...LEAD_SOURCES.map((s) => ({ value: s, label: SOURCE_LABELS[s] })),
            ]}
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value as LeadSource | "");
              setPage(1);
            }}
            className="w-40"
          />
        </div>

        {loading ? (
          <PageLoader />
        ) : leads.length === 0 ? (
          <EmptyState
            title="No leads found"
            description="Create your first lead to get started"
            actionLabel="New Lead"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <>
            <div className="glass-panel overflow-x-auto p-0 rounded-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02] text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-4">Name</th>
                    <th className="px-4 py-4">Company</th>
                    <th className="px-4 py-4">Stage</th>
                    <th className="px-4 py-4">Source</th>
                    <th className="px-4 py-4">Owner</th>
                    <th className="px-4 py-4">Created</th>
                    <th className="px-4 py-4 w-16" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-white/[0.04] transition-colors">
                      <td className="px-4 py-4">
                        <Link
                          to={`/leads/${lead.id}`}
                          className="font-medium text-white hover:text-brand-400 transition-colors"
                        >
                          {lead.name}
                        </Link>
                        {lead.email && (
                          <p className="text-xs text-slate-400 mt-1">{lead.email}</p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-slate-300">{lead.lead_company || "—"}</td>
                      <td className="px-4 py-4">
                        <StageBadge stage={lead.stage} />
                      </td>
                      <td className="px-4 py-4">
                        <SourceBadge source={lead.source} />
                      </td>
                      <td className="px-4 py-4 text-slate-300">
                        {lead.owner?.full_name || "—"}
                      </td>
                      <td className="px-4 py-4 text-slate-400">{formatDate(lead.created_at)}</td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => setDeleteId(lead.id)}
                          className="rounded p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                          title="Delete Lead"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-slate-400">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="bg-white/5 border-white/10 hover:bg-white/10 text-white"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="bg-white/5 border-white/10 hover:bg-white/10 text-white"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <LeadFormModal
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreate}
      />
      <ConfirmDeleteModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        itemName="this lead"
        isDeleting={isDeleting}
      />
    </>
  );
}
