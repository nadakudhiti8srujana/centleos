import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { FileAttachmentWidget } from "@/components/ui/FileAttachmentWidget";
import { Card } from "@/components/ui/Card";
import { PageLoader } from "@/components/ui/Spinner";
import { formatCurrency, formatDate } from "@/lib/utils";
import { erpInvoicesService } from "@/services/erp_invoices";
import type { ERPInvoice } from "@/types";
import { ArrowLeft, Check, Clock, FileText, Send, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export function ERPInvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<ERPInvoice | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await erpInvoicesService.get(id);
      setInvoice(data);
    } catch (e) {
      console.error(e);
      navigate("/invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const updateStatus = async (status: "draft" | "sent" | "paid" | "overdue") => {
    if (!id) return;
    await erpInvoicesService.updateStatus(id, status);
    load();
  };

  if (loading) return <PageLoader />;
  if (!invoice) return null;

  return (
    <>
      <Header
        title={`Invoice ${invoice.invoice_number}`}
        subtitle="ERP Module"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/invoices")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={async () => {
                if (confirm("Delete this invoice?")) {
                  await erpInvoicesService.delete(invoice.id);
                  navigate("/invoices");
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide
                  ${
                    invoice.status === "paid"
                      ? "bg-emerald-100 text-emerald-700"
                      : invoice.status === "sent"
                      ? "bg-blue-100 text-blue-700"
                      : invoice.status === "overdue"
                      ? "bg-red-100 text-red-700"
                      : "bg-slate-100 text-slate-700 dark:text-slate-300"
                  }
                `}
              >
                {invoice.status}
              </span>
            </h2>
            <div className="flex gap-2">
              {invoice.status === "draft" && (
                <Button size="sm" onClick={() => updateStatus("sent")}>
                  <Send className="mr-2 h-4 w-4" /> Mark as Sent
                </Button>
              )}
              {invoice.status === "sent" && (
                <>
                  <Button size="sm" onClick={() => updateStatus("paid")}>
                    <Check className="mr-2 h-4 w-4" /> Mark as Paid
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600" onClick={() => updateStatus("overdue")}>
                    <Clock className="mr-2 h-4 w-4" /> Mark as Overdue
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-500" />
                Invoice Details
              </h3>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2">
                  <span className="text-slate-500 dark:text-slate-400">Invoice Number</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{invoice.invoice_number}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-slate-500 dark:text-slate-400">Issue Date</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{formatDate(invoice.issue_date)}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-slate-500 dark:text-slate-400">Due Date</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{formatDate(invoice.due_date)}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-slate-500 dark:text-slate-400">Customer ID</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100 truncate" title={invoice.customer_id}>{invoice.customer_id}</span>
                </div>
              </div>
            </Card>
            
            <Card className="bg-indigo-50 border-indigo-100">
              <h3 className="mb-4 text-base font-semibold text-indigo-900">Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2">
                  <span className="text-indigo-700">Subtotal</span>
                  <span className="text-right font-medium text-indigo-900">{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-indigo-700">Tax</span>
                  <span className="text-right font-medium text-indigo-900">{formatCurrency(invoice.tax)}</span>
                </div>
                <div className="mt-2 grid grid-cols-2 border-t border-indigo-200 pt-3">
                  <span className="text-base font-bold text-indigo-900">Total Amount</span>
                  <span className="text-right text-base font-bold text-indigo-900">
                    {formatCurrency(invoice.total_amount)}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          <Card padding={false}>
            <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Invoice Items</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                  <th className="px-6 py-3">Item Description</th>
                  <th className="px-6 py-3 text-right">Quantity</th>
                  <th className="px-6 py-3 text-right">Unit Price</th>
                  <th className="px-6 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-900/50">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{item.item_name}</td>
                    <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">{item.quantity}</td>
                    <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">{formatCurrency(item.unit_price)}</td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900 dark:text-slate-100">{formatCurrency(item.total || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          
          {id && (
            <div className="mt-6">
              <FileAttachmentWidget entityType="invoice" entityId={id} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
