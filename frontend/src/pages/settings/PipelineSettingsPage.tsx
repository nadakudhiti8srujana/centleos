import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageLoader } from "@/components/ui/Spinner";
import { pipelineStagesService, type PipelineStage, type PipelineStageCreate } from "@/services/pipeline_stages";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

function StageFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PipelineStageCreate) => Promise<void>;
  initialData?: PipelineStage | null;
}) {
  const [form, setForm] = useState<PipelineStageCreate>({
    name: "",
    description: "",
    color: "#3b82f6",
    order_index: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData && open) {
      setForm({
        name: initialData.name,
        description: initialData.description || "",
        color: initialData.color || "#3b82f6",
        order_index: initialData.order_index,
      });
    } else if (open) {
      setForm({
        name: "",
        description: "",
        color: "#3b82f6",
        order_index: 0,
      });
    }
  }, [initialData, open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialData ? "Edit Stage" : "New Stage"}
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
            {initialData ? "Save Changes" : "Create Stage"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Input
          label="Stage Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <Input
          label="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              label="Order Index"
              type="number"
              value={form.order_index}
              onChange={(e) => setForm({ ...form, order_index: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Color</label>
            <input
              type="color"
              className="h-10 w-full cursor-pointer rounded-md border border-slate-300 p-1"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}

export function PipelineSettingsPage() {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await pipelineStagesService.list();
      setStages(res.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this custom stage? Leads in this stage might not render correctly.")) return;
    await pipelineStagesService.delete(id);
    load();
  };

  const handleSave = async (data: PipelineStageCreate) => {
    if (editingStage) {
      await pipelineStagesService.update(editingStage.id, data);
    } else {
      await pipelineStagesService.create(data);
    }
    load();
  };

  return (
    <>
      <Header
        title="Custom Pipeline Stages"
        subtitle="Define custom pipeline stages for your company."
        actions={
          <Button onClick={() => {
            setEditingStage(null);
            setShowForm(true);
          }}>
            <Plus className="h-4 w-4" />
            New Stage
          </Button>
        }
      />
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <PageLoader />
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-card max-w-4xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Color</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stages.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 dark:text-slate-400">
                      No custom stages defined. You are using the default system stages.
                    </td>
                  </tr>
                ) : (
                  stages.map((stage) => (
                    <tr key={stage.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-900/50">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{stage.order_index}</td>
                      <td className="px-4 py-3">
                        <div 
                          className="w-6 h-6 rounded-md shadow-sm" 
                          style={{ backgroundColor: stage.color || '#ccc' }} 
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{stage.name}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{stage.description || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            setEditingStage(stage);
                            setShowForm(true);
                          }}
                          className="rounded p-1 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 mr-2"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(stage.id)}
                          className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <StageFormModal
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleSave}
        initialData={editingStage}
      />
    </>
  );
}
