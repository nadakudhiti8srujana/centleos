import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageLoader } from "@/components/ui/Spinner";
import { SearchInput } from "@/components/ui/SearchInput";
import { Textarea } from "@/components/ui/Textarea";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate } from "@/lib/utils";
import { accountsService, type AccountCreateData } from "@/services/accounts";
import type { Account } from "@/types";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";

function AccountFormModal({
  open,
  onClose,
  onSubmit,
  title,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AccountCreateData) => Promise<void>;
  title: string;
}) {
  const [form, setForm] = useState<AccountCreateData>({
    name: "",
    website: "",
    industry: "",
    phone: "",
    email: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);

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
          label="Account name *"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="sm:col-span-2"
          required
        />
        <Input
          label="Website"
          value={form.website}
          onChange={(e) => setForm({ ...form, website: e.target.value })}
        />
        <Input
          label="Industry"
          value={form.industry}
          onChange={(e) => setForm({ ...form, industry: e.target.value })}
        />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <Input
          label="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <Textarea
          label="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="sm:col-span-2"
        />
      </div>
    </Modal>
  );
}

export function AccountsPage() {
  const { isSuperAdmin, workspaceId } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
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
        ? await accountsService.search(search, page)
        : await accountsService.list(page);
      setAccounts(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } finally {
      setLoading(false);
    }
  }, [page, search, workspaceId, isSuperAdmin]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await accountsService.delete(deleteId);
      toast.success("Account deleted successfully");
      load();
    } catch (e) {
      toast.error("Failed to delete account");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <>
      <Header
        title="Accounts"
        subtitle={`${total} accounts`}
        actions={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            New Account
          </Button>
        }
      />
      <div className="flex-1 overflow-y-auto p-6">
        <SearchInput
          placeholder="Search accounts..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="mb-4 w-64"
        />

        {loading ? (
          <PageLoader />
        ) : accounts.length === 0 ? (
          <EmptyState title="No accounts" actionLabel="New Account" onAction={() => setShowForm(true)} />
        ) : (
          <>
            <div className="glass-panel overflow-x-auto p-0 rounded-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02] text-left text-xs font-medium uppercase text-slate-400">
                    <th className="px-4 py-4">Name</th>
                    <th className="px-4 py-4">Industry</th>
                    <th className="px-4 py-4">Email</th>
                    <th className="px-4 py-4">Website</th>
                    <th className="px-4 py-4">Created</th>
                    <th className="w-12 px-4 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {accounts.map((a) => (
                    <tr key={a.id} className="hover:bg-white/[0.04] transition-colors">
                      <td className="px-4 py-4 font-medium text-white">{a.name}</td>
                      <td className="px-4 py-4 text-slate-300">{a.industry || "—"}</td>
                      <td className="px-4 py-4 text-slate-300">{a.email || "—"}</td>
                      <td className="px-4 py-4 text-slate-300">{a.website || "—"}</td>
                      <td className="px-4 py-4 text-slate-400">{formatDate(a.created_at)}</td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => setDeleteId(a.id)}
                          className="rounded p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                          title="Delete Account"
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

      <AccountFormModal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="New Account"
        onSubmit={async (data) => {
          await accountsService.create(data);
          load();
        }}
      />
      <ConfirmDeleteModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        itemName="this account"
        isDeleting={isDeleting}
      />
    </>
  );
}
