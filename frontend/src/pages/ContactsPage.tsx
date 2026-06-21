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
import { contactsService, type ContactCreateData } from "@/services/contacts";
import type { Contact } from "@/types";
import { ChevronLeft, ChevronRight, Plus, Trash2, Download } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { FileAttachmentWidget } from "@/components/ui/FileAttachmentWidget";


function ContactFormModal({
  open,
  onClose,
  onSubmit,
  initial,
  title,
  contactId,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ContactCreateData) => Promise<void>;
  initial?: Partial<ContactCreateData>;
  title: string;
  contactId?: string;
}) {
  const [form, setForm] = useState<ContactCreateData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    job_title: "",
    contact_company: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        first_name: initial?.first_name || "",
        last_name: initial?.last_name || "",
        email: initial?.email || "",
        phone: initial?.phone || "",
        job_title: initial?.job_title || "",
        contact_company: initial?.contact_company || "",
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
          label="First name *"
          value={form.first_name}
          onChange={(e) => setForm({ ...form, first_name: e.target.value })}
          required
        />
        <Input
          label="Last name *"
          value={form.last_name}
          onChange={(e) => setForm({ ...form, last_name: e.target.value })}
          required
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
        <Input
          label="Job title"
          value={form.job_title}
          onChange={(e) => setForm({ ...form, job_title: e.target.value })}
        />
        <Input
          label="Company"
          value={form.contact_company}
          onChange={(e) => setForm({ ...form, contact_company: e.target.value })}
        />
        <Textarea
          label="Notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="sm:col-span-2"
        />
      </div>

      {contactId && (
        <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-6">
          <FileAttachmentWidget entityType="contact" entityId={contactId} />
        </div>
      )}
    </Modal>
  );
}

export function ContactsPage() {
  const { isSuperAdmin, workspaceId } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
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
        ? await contactsService.search(search, page)
        : await contactsService.list(page);
      setContacts(res.items);
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

  const handleExport = async () => {
    const blob = await contactsService.export();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contacts_export.csv";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await contactsService.delete(deleteId);
      toast.success("Contact deleted successfully");
      load();
    } catch (e) {
      toast.error("Failed to delete contact");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <>
      <Header
        title="Contacts"
        subtitle={`${total} contacts`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" />
              New Contact
            </Button>
          </div>
        }
      />
      <div className="flex-1 overflow-y-auto p-6">
        <SearchInput
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="mb-4 w-64"
        />

        {loading ? (
          <PageLoader />
        ) : contacts.length === 0 ? (
          <EmptyState
            title="No contacts"
            actionLabel="New Contact"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <>
            <div className="glass-panel overflow-x-auto p-0 rounded-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02] text-left text-xs font-medium uppercase text-slate-400">
                    <th className="px-4 py-4">Name</th>
                    <th className="px-4 py-4">Email</th>
                    <th className="px-4 py-4">Phone</th>
                    <th className="px-4 py-4">Company</th>
                    <th className="px-4 py-4">Created</th>
                    <th className="w-12 px-4 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {contacts.map((c) => (
                    <tr key={c.id} className="hover:bg-white/[0.04] transition-colors">
                      <td className="px-4 py-4 font-medium text-white">{c.full_name}</td>
                      <td className="px-4 py-4 text-slate-300">{c.email || "—"}</td>
                      <td className="px-4 py-4 text-slate-300">{c.phone || "—"}</td>
                      <td className="px-4 py-4 text-slate-300">{c.contact_company || "—"}</td>
                      <td className="px-4 py-4 text-slate-400">{formatDate(c.created_at)}</td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => setEditContact(c)}
                          className="mr-3 text-brand-400 hover:text-brand-300 transition-colors"
                          title="Edit Contact"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteId(c.id)}
                          className="text-slate-500 hover:text-red-400 transition-colors"
                          title="Delete Contact"
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

      <ContactFormModal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="New Contact"
        onSubmit={async (data) => {
          await contactsService.create(data);
          load();
        }}
      />
      {editContact && (
        <ContactFormModal
          open={!!editContact}
          onClose={() => setEditContact(null)}
          title="Edit Contact"
          contactId={editContact.id}
          initial={{
            first_name: editContact.first_name,
            last_name: editContact.last_name,
            email: editContact.email || "",
            phone: editContact.phone || "",
            job_title: editContact.job_title || "",
            contact_company: editContact.contact_company || "",
            notes: editContact.notes || "",
          }}
          onSubmit={async (data) => {
            await contactsService.update(editContact.id, data);
            setEditContact(null);
            load();
          }}
        />
      )}
      <ConfirmDeleteModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        itemName="this contact"
        isDeleting={isDeleting}
      />
    </>
  );
}
