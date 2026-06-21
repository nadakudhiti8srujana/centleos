import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageLoader } from "@/components/ui/Spinner";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import { erpInvoicesService } from "@/services/erp_invoices";
import type { ERPInvoice, ERPInvoiceCreate, ERPInvoiceStatus } from "@/types";
import { FileText, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";

function InvoiceFormModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ERPInvoiceCreate) => Promise<void>;
}) {
  const [form, setForm] = useState<ERPInvoiceCreate>({
    customer_id: "",
    invoice_number: "",
    issue_date: new Date().toISOString().split("T")[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    items: [{ item_name: "", quantity: 1, unit_price: 0 }],
  });
  const [loading, setLoading] = useState(false);

  const subtotal = form.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create ERP Invoice"
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
            Create Invoice
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Invoice Number *"
          value={form.invoice_number}
          onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
          required
        />
        <Input
          label="Customer ID (UUID) *"
          value={form.customer_id}
          onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
          required
        />
        <Input
          label="Issue Date *"
          type="date"
          value={form.issue_date}
          onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
          required
        />
        <Input
          label="Due Date *"
          type="date"
          value={form.due_date}
          onChange={(e) => setForm({ ...form, due_date: e.target.value })}
          required
        />
      </div>

      <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="font-semibold text-slate-900 dark:text-slate-100">Invoice Items</h4>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setForm({
                ...form,
                items: [...form.items, { item_name: "", quantity: 1, unit_price: 0 }],
              })
            }
          >
            <Plus className="mr-1 h-4 w-4" /> Add Item
          </Button>
        </div>

        {form.items.map((item, idx) => (
          <div key={idx} className="mb-3 grid gap-3 sm:grid-cols-12 items-end border bg-slate-50 dark:bg-slate-900/50 p-3 rounded">
            <div className="sm:col-span-5">
              <Input
                label="Description"
                value={item.item_name}
                onChange={(e) => {
                  const newItems = [...form.items];
                  newItems[idx].item_name = e.target.value;
                  setForm({ ...form, items: newItems });
                }}
              />
            </div>
            <div className="sm:col-span-2">
              <Input
                label="Qty"
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => {
                  const newItems = [...form.items];
                  newItems[idx].quantity = parseInt(e.target.value) || 1;
                  setForm({ ...form, items: newItems });
                }}
              />
            </div>
            <div className="sm:col-span-3">
              <Input
                label="Unit Price"
                type="number"
                min="0"
                step="0.01"
                value={item.unit_price}
                onChange={(e) => {
                  const newItems = [...form.items];
                  newItems[idx].unit_price = parseFloat(e.target.value) || 0;
                  setForm({ ...form, items: newItems });
                }}
              />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <Button
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => {
                  const newItems = [...form.items];
                  newItems.splice(idx, 1);
                  setForm({ ...form, items: newItems });
                }}
                disabled={form.items.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-col items-end text-sm">
        <p className="text-slate-500 dark:text-slate-400">Subtotal: {formatCurrency(subtotal)}</p>
        <p className="text-slate-500 dark:text-slate-400">Tax (10%): {formatCurrency(tax)}</p>
        <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">Total: {formatCurrency(total)}</p>
      </div>
    </Modal>
  );
}

export function ERPInvoicesPage() {
  const { isSuperAdmin, workspaceId } = useAuth();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<ERPInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ERPInvoiceStatus | "all">("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    if (isSuperAdmin && !workspaceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await erpInvoicesService.list(
        undefined,
        statusFilter === "all" ? undefined : statusFilter
      );
      setInvoices(res);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, isSuperAdmin, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await erpInvoicesService.delete(deleteId);
      toast.success("Invoice deleted successfully");
      load();
    } catch (e) {
      toast.error("Failed to delete invoice");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await erpInvoicesService.export();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "invoices.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export failed", error);
      toast.error("Export failed. Please try again.");
    }
  };

  return (
    <>
      <Header
        title="ERP Invoices"
        subtitle={`${invoices.length} total invoices`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <FileText className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" />
              New Invoice
            </Button>
          </div>
        }
      />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-4 flex items-center gap-4">
          <select
            className="rounded-md border-slate-300 py-2 pl-3 pr-10 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ERPInvoiceStatus | "all")}
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        {loading ? (
          <PageLoader />
        ) : invoices.length === 0 ? (
          <EmptyState
            title="No invoices found"
            actionLabel="Create Invoice"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <div className="glass-panel overflow-x-auto p-0 rounded-xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02] text-left text-xs font-medium uppercase text-slate-400">
                  <th className="px-4 py-4">Invoice #</th>
                  <th className="px-4 py-4">Issue Date</th>
                  <th className="px-4 py-4">Due Date</th>
                  <th className="px-4 py-4">Total Amount</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-white/[0.04] transition-colors cursor-pointer" onClick={() => navigate(`/invoices/${inv.id}`)}>
                    <td className="px-4 py-4 font-medium text-white">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-brand-400" />
                        {inv.invoice_number}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-300">{formatDate(inv.issue_date)}</td>
                    <td className="px-4 py-4 text-slate-300">{formatDate(inv.due_date)}</td>
                    <td className="px-4 py-4 font-medium text-emerald-400">{formatCurrency(inv.total_amount)}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide
                          ${
                            inv.status === "paid"
                              ? "bg-emerald-100 text-emerald-700"
                              : inv.status === "sent"
                              ? "bg-blue-100 text-blue-700"
                              : inv.status === "overdue"
                              ? "bg-red-100 text-red-700"
                              : "bg-slate-100 text-slate-700 dark:text-slate-300"
                          }
                        `}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(inv.id);
                        }}
                        className="rounded p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                        title="Delete Invoice"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <InvoiceFormModal
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={async (data) => {
          await erpInvoicesService.create(data);
          load();
        }}
      />
      <ConfirmDeleteModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        itemName="this invoice"
        isDeleting={isDeleting}
      />
    </>
  );
}
