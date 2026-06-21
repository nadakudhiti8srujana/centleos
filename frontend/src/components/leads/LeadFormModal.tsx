import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import type { LeadCreateData } from "@/services/leads";
import { LEAD_SOURCES, LEAD_STAGES, SOURCE_LABELS, STAGE_LABELS } from "@/types";
import { useEffect, useState } from "react";

interface LeadFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: LeadCreateData) => Promise<void>;
  initial?: Partial<LeadCreateData>;
  title?: string;
}

export function LeadFormModal({
  open,
  onClose,
  onSubmit,
  initial,
  title = "New Lead",
}: LeadFormModalProps) {
  const [form, setForm] = useState<LeadCreateData>({
    name: "",
    email: "",
    phone: "",
    source: "organic",
    stage: "new",
    lead_company: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        name: initial?.name || "",
        email: initial?.email || "",
        phone: initial?.phone || "",
        source: initial?.source || "organic",
        stage: initial?.stage || "new",
        lead_company: initial?.lead_company || "",
        notes: initial?.notes || "",
      });
    }
  }, [open, initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(form);
      onClose();
    } finally {
      setLoading(false);
    }
  };

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
          <Button loading={loading} type="submit" form="lead-form">
            Save Lead
          </Button>
        </>
      }
    >
      <form id="lead-form" onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Name *"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          className="sm:col-span-2"
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
          label="Company"
          value={form.lead_company}
          onChange={(e) => setForm({ ...form, lead_company: e.target.value })}
        />
        <Select
          label="Source"
          options={LEAD_SOURCES.map((s) => ({ value: s, label: SOURCE_LABELS[s] }))}
          value={form.source}
          onChange={(e) => setForm({ ...form, source: e.target.value as typeof form.source })}
        />
        <Select
          label="Stage"
          options={LEAD_STAGES.map((s) => ({ value: s, label: STAGE_LABELS[s] }))}
          value={form.stage}
          onChange={(e) => setForm({ ...form, stage: e.target.value as typeof form.stage })}
        />
        <Textarea
          label="Notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="sm:col-span-2"
        />
      </form>
    </Modal>
  );
}
