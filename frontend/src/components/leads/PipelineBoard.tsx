import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { StageBadge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { Lead, LeadStage, PipelineResponse, PipelineStageColumn } from "@/types";
import { GripVertical, Mail, Phone } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

function LeadCard({ lead, isDragging }: { lead: Lead; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: lead.id,
    data: { lead, stage: lead.stage, custom_stage_id: lead.custom_stage_id },
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 shadow-card transition-shadow hover:shadow-elevated",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-start gap-2">
        <button
          {...listeners}
          {...attributes}
          className="mt-0.5 cursor-grab text-slate-300 hover:text-slate-500 dark:text-slate-400 active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <Link
            to={`/leads/${lead.id}`}
            className="block truncate font-medium text-slate-900 dark:text-slate-100 hover:text-brand-600"
          >
            {lead.name}
          </Link>
          {lead.lead_company && (
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{lead.lead_company}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
            {lead.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {lead.email}
              </span>
            )}
            {lead.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {lead.phone}
              </span>
            )}
          </div>
          {lead.owner && (
            <p className="mt-2 text-xs text-slate-400">{lead.owner.full_name}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StageColumn({
  col,
}: {
  col: PipelineStageColumn;
}) {
  const { stage, stage_id, leads, count, color } = col;
  const { setNodeRef, isOver } = useDroppable({ id: stage_id || stage });

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {color ? (
            <span
              className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium"
              style={{ backgroundColor: `${color}20`, color: color }}
            >
              {stage}
            </span>
          ) : (
            <StageBadge stage={stage as LeadStage} />
          )}
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{count}</span>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[200px] flex-1 flex-col gap-2 rounded-xl bg-slate-100/80 p-2 transition-colors",
          isOver && "bg-brand-50 ring-2 ring-brand-300"
        )}
      >
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
        {leads.length === 0 && (
          <p className="py-8 text-center text-xs text-slate-400">Drop leads here</p>
        )}
      </div>
    </div>
  );
}

interface PipelineBoardProps {
  pipeline: PipelineResponse;
  onStageChange: (leadId: string, stage: string, custom_stage_id?: string) => Promise<void>;
}

export function PipelineBoard({ pipeline, onStageChange }: PipelineBoardProps) {
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const lead = event.active.data.current?.lead as Lead;
    setActiveLead(lead);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveLead(null);
    const { active, over } = event;
    if (!over) return;

    const leadId = active.id as string;
    const overId = over.id as string; // could be stage string or stage_id uuid
    
    // Find if overId is a custom_stage_id by looking up the pipeline
    let newCustomStageId: string | undefined;
    let newStageStr: string = overId;
    
    const targetCol = pipeline.stages.find(c => c.stage_id === overId || c.stage === overId);
    if (targetCol) {
      if (targetCol.stage_id) {
        newCustomStageId = targetCol.stage_id;
        newStageStr = "new"; // fallback for enum if custom
      } else {
        newStageStr = targetCol.stage;
      }
    }

    const currentStage = active.data.current?.stage as LeadStage;
    const currentCustomStageId = active.data.current?.custom_stage_id as string | undefined;

    if (newStageStr !== currentStage || newCustomStageId !== currentCustomStageId) {
      await onStageChange(leadId, newStageStr, newCustomStageId);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {pipeline.stages.map((col) => (
          <StageColumn key={col.stage_id || col.stage} col={col} />
        ))}
      </div>
      <DragOverlay>
        {activeLead ? <LeadCard lead={activeLead} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
