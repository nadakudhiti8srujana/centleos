import { Header } from "@/components/layout/Header";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageLoader } from "@/components/ui/Spinner";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import { dealsService, type DealCreateData } from "@/services/deals";
import type { Deal, DealStatus } from "@/types";
import { DEAL_STATUSES, STATUS_LABELS } from "@/types";
import { ChevronLeft, ChevronRight, Plus, Trash2, Download } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { FileAttachmentWidget } from "@/components/ui/FileAttachmentWidget";

function DealFormModal({
  open,
  onClose,
  onSubmit,
  title,
  initial,
  dealId,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: DealCreateData) => Promise<void>;
  title: string;
  initial?: Partial<DealCreateData>;
  dealId?: string;
}) {
  const [form, setForm] = useState<DealCreateData>({
    name: "",
    deal_value: 0,
    probability: 0,
    status: "open",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        name: initial?.name || "",
        deal_value: initial?.deal_value ?? 0,
        probability: initial?.probability ?? 0,
        status: initial?.status || "open",
        expected_close_date: initial?.expected_close_date,
        notes: initial?.notes || "",
      });
    }
  }, [open, initial]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={loading}
            onClick={async () => {
              setLoading(true);
              try {
                await onSubmit(form);
                onClose();
              } finally {
                setLoading(false);
              }
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Deal name *"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="sm:col-span-2"
          required
        />
        <Input
          label="Value (INR)"
          type="number"
          min={0}
          value={form.deal_value}
          onChange={(e) => setForm({ ...form, deal_value: Number(e.target.value) })}
        />
        <Input
          label="Probability (%)"
          type="number"
          min={0}
          max={100}
          value={form.probability}
          onChange={(e) => setForm({ ...form, probability: Number(e.target.value) })}
        />
        <Select
          label="Status"
          options={DEAL_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as DealStatus })}
        />
        <Input
          label="Expected close date"
          type="date"
          value={form.expected_close_date || ""}
          onChange={(e) => setForm({ ...form, expected_close_date: e.target.value })}
        />
        <Textarea
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="sm:col-span-2"
        />
      </div>
      
      {dealId && (
        <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-6">
          <FileAttachmentWidget entityType="deal" entityId={dealId} />
        </div>
      )}
    </Modal>
  );
}

export function DealsPage() {
  const { isSuperAdmin, workspaceId } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<DealStatus | "">("");
  const [showForm, setShowForm] = useState(false);
  const [editDeal, setEditDeal] = useState<Deal | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    if (isSuperAdmin && !workspaceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await dealsService.list({
        page,
        page_size: 15,
        status: statusFilter || undefined,
      });
      setDeals(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, workspaceId, isSuperAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  const handleExport = async () => {
    const blob = await dealsService.export();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "deals_export.csv";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await dealsService.delete(deleteId);
      toast.success("Deal deleted successfully");
      load();
    } catch (e) {
      toast.error("Failed to delete deal");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <>
      <Header
        title="Deals"
        subtitle={`${total} deals`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" />
              New Deal
            </Button>
          </div>
        }
      />
      <div className="flex-1 overflow-y-auto p-6">
        <Select
          options={[
            { value: "", label: "All statuses" },
            ...DEAL_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
          ]}
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as DealStatus | "");
            setPage(1);
          }}
          className="mb-4 w-40"
        />

        {loading ? (
          <PageLoader />
        ) : deals.length === 0 ? (
          <EmptyState title="No deals" actionLabel="New Deal" onAction={() => setShowForm(true)} />
        ) : (
          <>
            <div className="glass-panel overflow-x-auto p-0 rounded-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02] text-left text-xs font-medium uppercase text-slate-400">
                    <th className="px-4 py-4">Deal</th>
                    <th className="px-4 py-4">Value</th>
                    <th className="px-4 py-4">Probability</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Owner</th>
                    <th className="px-4 py-4">Close date</th>
                    <th className="w-20 px-4 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {deals.map((d) => (
                    <tr key={d.id} className="hover:bg-white/[0.04] transition-colors">
                      <td className="px-4 py-4">
                        <button
                          onClick={() => setEditDeal(d)}
                          className="font-medium text-white hover:text-brand-400 transition-colors text-left"
                        >
                          {d.name}
                        </button>
                      </td>
                      <td className="px-4 py-4 font-medium text-emerald-400">
                        {formatCurrency(d.deal_value)}
                      </td>
                      <td className="px-4 py-4 text-slate-300">{d.probability}%</td>
                      <td className="px-4 py-4">
                        <StatusBadge status={d.status} />
                      </td>
                      <td className="px-4 py-4 text-slate-300">{d.owner?.full_name || "—"}</td>
                      <td className="px-4 py-4 text-slate-400">
                        {formatDate(d.expected_close_date)}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => setDeleteId(d.id)}
                          className="rounded p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                          title="Delete Deal"
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
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <DealFormModal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="New Deal"
        onSubmit={async (data) => {
          await dealsService.create(data);
          load();
        }}
      />

      {editDeal && (
        <DealFormModal
          open={!!editDeal}
          onClose={() => setEditDeal(null)}
          title="Edit Deal"
          dealId={editDeal.id}
          initial={{
            name: editDeal.name,
            deal_value: parseFloat(editDeal.deal_value),
            probability: editDeal.probability,
            status: editDeal.status,
            expected_close_date: editDeal.expected_close_date || undefined,
            notes: editDeal.notes || "",
          }}
          onSubmit={async (data) => {
            await dealsService.update(editDeal.id, data);
            setEditDeal(null);
            load();
          }}
        />
      )}

      <ConfirmDeleteModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        itemName="this deal"
        isDeleting={isDeleting}
      />
    </>
  );
}
