import { Header } from "@/components/layout/Header";
import { PipelineBoard } from "@/components/leads/PipelineBoard";
import { LeadFormModal } from "@/components/leads/LeadFormModal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageLoader } from "@/components/ui/Spinner";
import { useAuth } from "@/contexts/AuthContext";
import { leadsService } from "@/services/leads";
import type { LeadStage, PipelineResponse } from "@/types";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export function PipelinePage() {
  const { isSuperAdmin, workspaceId } = useAuth();
  const [pipeline, setPipeline] = useState<PipelineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    if (isSuperAdmin && !workspaceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setPipeline(await leadsService.pipeline());
    } finally {
      setLoading(false);
    }
  }, [workspaceId, isSuperAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStageChange = async (leadId: string, stage: string, custom_stage_id?: string) => {
    await leadsService.updateStage(leadId, stage as LeadStage, custom_stage_id);
    load();
  };

  const handleCreate = async (data: Parameters<typeof leadsService.create>[0]) => {
    await leadsService.create(data);
    load();
  };

  return (
    <>
      <Header
        title="Pipeline"
        subtitle={pipeline ? `${pipeline.total_leads} leads in pipeline` : undefined}
        actions={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            New Lead
          </Button>
        }
      />
      <div className="flex-1 overflow-hidden p-6">
        {loading ? (
          <PageLoader />
        ) : isSuperAdmin && !workspaceId ? (
          <Card className="text-center text-slate-600 dark:text-slate-400">
            Enter a workspace UUID in the header to view the pipeline.
          </Card>
        ) : pipeline ? (
          <PipelineBoard pipeline={pipeline} onStageChange={handleStageChange} />
        ) : null}
      </div>

      <LeadFormModal
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreate}
      />
    </>
  );
}
