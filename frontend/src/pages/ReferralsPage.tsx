import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageLoader } from "@/components/ui/Spinner";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate } from "@/lib/utils";
import { referralsService, type ReferralLinkCreateData } from "@/services/referrals";
import type { Referral, ReferralLink, PayoutStats } from "@/types";
import { LinkIcon, Check, Copy, DollarSign, Activity, Download, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";

function LinkFormModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ReferralLinkCreateData) => Promise<void>;
}) {
  const [form, setForm] = useState<ReferralLinkCreateData>({
    code: "",
    commission_rate: 10,
  });
  const [loading, setLoading] = useState(false);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Referral Link"
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
            Generate Link
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Input
          label="Custom Code (Optional)"
          placeholder="e.g. SUMMER2024"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
        />
      </div>
    </Modal>
  );
}

export function ReferralsPage() {
  const { isSuperAdmin, workspaceId, user } = useAuth();
  const isCompanyAdmin = user?.role === "company_admin";
  const isAdmin = isCompanyAdmin || isSuperAdmin;
  
  const [links, setLinks] = useState<ReferralLink[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<PayoutStats | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"links" | "payouts">("links");
  const [deleteLinkId, setDeleteLinkId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    if (isSuperAdmin && !workspaceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [linksRes, refsRes, statsRes] = await Promise.all([
        referralsService.getLinks(),
        referralsService.getReferrals(),
        referralsService.getStats(),
      ]);
      setLinks(linksRes);
      setReferrals(refsRes);
      setStats(statsRes);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, isSuperAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Link copied to clipboard!");
  };

  const handleDeleteLink = async () => {
    if (!deleteLinkId) return;
    setIsDeleting(true);
    try {
      await referralsService.deleteLink(deleteLinkId);
      toast.success("Referral link deleted");
      load();
    } catch (e) {
      toast.error("Failed to delete link");
    } finally {
      setIsDeleting(false);
      setDeleteLinkId(null);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm("Approve this payout?")) return;
    await referralsService.approvePayout(id);
    load();
  };

  const handleReject = async (id: string) => {
    if (!confirm("Reject this payout?")) return;
    await referralsService.rejectPayout(id);
    load();
  };

  const handleMarkPaid = async (id: string) => {
    if (!confirm("Mark this payout as paid?")) return;
    await referralsService.markPaid(id);
    load();
  };

  const handleExport = async () => {
    try {
      const blob = await referralsService.export();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "referrals.csv";
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
        title="Referrals & Revenue Share"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={() => setShowForm(true)}>
              <LinkIcon className="h-4 w-4" />
              New Link
            </Button>
          </div>
        }
      />
      
      <div className="flex-1 overflow-y-auto p-6">
        {stats && (
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="glass-panel p-4 rounded-xl shadow-glow-crm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-indigo-500/10 p-2 text-brand-400">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">Pending</p>
                  <p className="text-xl font-bold text-white">${stats.pending_commission}</p>
                </div>
              </div>
            </div>
            <div className="glass-panel p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
                  <Check className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">Approved</p>
                  <p className="text-xl font-bold text-white">${stats.approved_commission}</p>
                </div>
              </div>
            </div>
            <div className="glass-panel p-4 rounded-xl shadow-glow-erp">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">Paid</p>
                  <p className="text-xl font-bold text-white">${stats.paid_commission}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-4 flex gap-4 border-b border-white/10 pb-2">
          <button
            className={`font-medium transition-colors ${activeTab === "links" ? "text-brand-400 border-b-2 border-brand-400" : "text-slate-400 hover:text-white"}`}
            onClick={() => setActiveTab("links")}
          >
            My Referral Links
          </button>
          <button
            className={`font-medium transition-colors ${activeTab === "payouts" ? "text-brand-400 border-b-2 border-brand-400" : "text-slate-400 hover:text-white"}`}
            onClick={() => setActiveTab("payouts")}
          >
            Conversions & Payouts
          </button>
        </div>

        {loading ? (
          <PageLoader />
        ) : activeTab === "links" ? (
          links.length === 0 ? (
            <EmptyState title="No referral links" actionLabel="Create Link" onAction={() => setShowForm(true)} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {links.map((link) => (
                <div key={link.id} className="glass-panel rounded-xl p-5 hover:bg-white/[0.04] transition-colors">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="rounded-full bg-brand-500/10 px-2.5 py-1 text-xs font-semibold text-brand-400">
                      Code: {link.code}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(link.url)}
                        className="text-slate-500 hover:text-brand-400 transition-colors"
                        title="Copy Link"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteLinkId(link.id)}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                        title="Delete Link"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mb-4 truncate text-sm text-slate-300 bg-white/5 p-2 rounded border border-white/10">
                    {link.url}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div>
                      <p className="text-xs text-slate-400">Clicks</p>
                      <p className="font-semibold text-white">{link.click_count}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Leads</p>
                      <p className="font-semibold text-white">{link.lead_count}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Sales</p>
                      <p className="font-semibold text-white">{link.conversion_count}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          referrals.length === 0 ? (
            <EmptyState title="No conversions yet" />
          ) : (
            <div className="glass-panel overflow-hidden rounded-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02] text-left text-xs font-medium uppercase text-slate-400">
                    {isAdmin && <th className="px-4 py-4">Ambassador</th>}
                    <th className="px-4 py-4">Date</th>
                    <th className="px-4 py-4">Amount</th>
                    <th className="px-4 py-4">Status</th>
                    {isAdmin && <th className="px-4 py-4">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {referrals.map((ref) => (
                    <tr key={ref.id} className="hover:bg-white/[0.04] transition-colors">
                      {isAdmin && <td className="px-4 py-4 text-white">{ref.ambassador?.full_name}</td>}
                      <td className="px-4 py-4 text-slate-400">{formatDate(ref.created_at)}</td>
                      <td className="px-4 py-4 font-medium text-emerald-400">${ref.commission_amount}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          ref.payout_status === 'pending' ? 'bg-slate-500/10 text-slate-300' :
                          ref.payout_status === 'approved' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {ref.payout_status}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-4">
                          {ref.payout_status === "pending" && (
                            <>
                              <Button size="sm" variant="outline" className="mr-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" onClick={() => handleApprove(ref.id)}>Approve</Button>
                              <Button size="sm" variant="outline" className="mr-2 border-rose-500/30 text-rose-400 hover:bg-rose-500/10" onClick={() => handleReject(ref.id)}>Reject</Button>
                            </>
                          )}
                          {ref.payout_status === "approved" && (
                            <Button size="sm" variant="outline" className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10" onClick={() => handleMarkPaid(ref.id)}>Mark Paid</Button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      <LinkFormModal
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={async (data) => {
          await referralsService.createLink(data);
          load();
        }}
      />
      <ConfirmDeleteModal
        open={!!deleteLinkId}
        onClose={() => setDeleteLinkId(null)}
        onConfirm={handleDeleteLink}
        itemName="this referral link"
        isDeleting={isDeleting}
      />
    </>
  );
}
