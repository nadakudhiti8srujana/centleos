import { Header } from "@/components/layout/Header";
import { FileAttachmentWidget } from "@/components/ui/FileAttachmentWidget";
import { LeadFormModal } from "@/components/leads/LeadFormModal";
import { SourceBadge, StageBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageLoader } from "@/components/ui/Spinner";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { formatDateTime, titleCase, cn } from "@/lib/utils";
import { activitiesService } from "@/services/activities";
import { leadsService } from "@/services/leads";
import type { Activity, ActivityType, Lead, LeadHistory } from "@/types";
import { ACTIVITY_TYPES } from "@/types";
import {
  ArrowLeft,
  Mail,
  Phone,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";

export function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [history, setHistory] = useState<LeadHistory[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [activityForm, setActivityForm] = useState({
    activity_type: "note" as ActivityType,
    title: "",
    description: "",
  });

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [leadData, historyData, timeline] = await Promise.all([
        leadsService.get(id),
        leadsService.history(id),
        activitiesService.getLeadTimeline(id),
      ]);
      setLead(leadData);
      setHistory(historyData);
      setActivities(timeline.activities);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpdate = async (data: Parameters<typeof leadsService.update>[1]) => {
    if (!id) return;
    await leadsService.update(id, data);
    load();
  };

  const handleDelete = async () => {
    if (!id || !confirm("Delete this lead?")) return;
    await leadsService.delete(id);
    navigate("/leads");
  };

  const handleAddActivity = async () => {
    if (!id) return;
    await activitiesService.createForLead(id, activityForm);
    setShowActivity(false);
    setActivityForm({ activity_type: "note", title: "", description: "" });
    load();
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm("Delete this activity?")) return;
    await activitiesService.delete(activityId);
    load();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  if (loading) {
    return (
      <>
        <Header title="Lead" />
        <div className="relative flex-1 overflow-y-auto bg-[#050816] text-white">
          <PageLoader />
        </div>
      </>
    );
  }

  if (!lead) {
    return (
      <>
        <Header title="Lead not found" />
        <div className="relative flex-1 overflow-y-auto bg-[#050816] text-white p-6">
          <Link to="/leads" className="text-brand-400 hover:text-brand-300">
            Back to leads
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title={lead.name}
        subtitle={lead.lead_company || undefined}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="bg-white/[0.02] border-white/10 hover:bg-white/[0.05] text-slate-200" onClick={() => setShowEdit(true)}>
              Edit
            </Button>
            <Button variant="danger" className="bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        }
      />
      
      {/* Forced Dark Mode Background Wrapper */}
      <div className="relative flex-1 overflow-y-auto bg-[#050816] text-white scrollbar-thin selection:bg-brand-500/30 selection:text-brand-200">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-900/40 via-[#050816] to-transparent"></div>
        
        <div className="relative z-10 p-6 max-w-7xl mx-auto">
          <Link
            to="/leads"
            className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-brand-400 transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to leads
          </Link>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-6 lg:grid-cols-3"
          >
            <div className="space-y-6 lg:col-span-2">
              <motion.div variants={itemVariants}>
                <Card>
                  <div className="flex flex-wrap items-center gap-3">
                    <StageBadge stage={lead.stage} />
                    <SourceBadge source={lead.source} />
                    {lead.ai_score != null && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                        <Sparkles className="h-3 w-3" />
                        AI Score: {lead.ai_score}
                      </span>
                    )}
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {lead.email && (
                      <div className="flex items-center gap-3 text-sm text-slate-300">
                        <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                          <Mail className="h-4 w-4 text-brand-400" />
                        </div>
                        {lead.email}
                      </div>
                    )}
                    {lead.phone && (
                      <div className="flex items-center gap-3 text-sm text-slate-300">
                        <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                          <Phone className="h-4 w-4 text-brand-400" />
                        </div>
                        {lead.phone}
                      </div>
                    )}
                  </div>

                  {lead.ai_next_action && (
                    <div className="mt-6 rounded-xl bg-brand-500/10 border border-brand-500/20 p-4 text-sm text-brand-200">
                      <strong className="text-brand-400">AI Suggestion:</strong> {lead.ai_next_action}
                    </div>
                  )}

                  {lead.notes && (
                    <div className="mt-6">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Notes</p>
                      <p className="mt-2 text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{lead.notes}</p>
                    </div>
                  )}
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card padding={false} className="overflow-hidden">
                  <div className="flex items-center justify-between border-b border-white/5 px-6 py-4 bg-white/[0.02]">
                    <h3 className="font-semibold text-white tracking-tight">Activity Timeline</h3>
                    <Button size="sm" onClick={() => setShowActivity(true)} className="bg-brand-600 hover:bg-brand-500 text-white border border-brand-500/50 shadow-glow-crm">
                      <Plus className="h-4 w-4 mr-1" />
                      Log Activity
                    </Button>
                  </div>
                  {activities.length === 0 ? (
                    <p className="py-12 text-center text-sm text-slate-500">No activities yet</p>
                  ) : (
                    <div className="divide-y divide-white/5 relative">
                      {activities.map((a) => (
                        <div key={a.id} className="flex gap-4 px-6 py-5 group hover:bg-white/[0.02] transition-colors">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 border border-white/10 text-sm font-bold uppercase text-brand-400 shadow-sm group-hover:scale-110 transition-transform">
                            {a.activity_type[0]}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-semibold text-white">{a.title}</p>
                                <p className="text-xs capitalize text-slate-400 mt-1">
                                  <span className="text-brand-400">{a.activity_type}</span> · {a.creator?.full_name || "Unknown"} ·{" "}
                                  {formatDateTime(a.created_at)}
                                </p>
                              </div>
                              <button
                                onClick={() => handleDeleteActivity(a.id)}
                                className="text-slate-500 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100 p-2"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            {a.description && (
                              <div className="mt-3 text-sm text-slate-300 bg-white/5 border border-white/5 rounded-lg p-3">
                                {a.description}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </motion.div>
            </div>

            <div className="space-y-6">
              <motion.div variants={itemVariants}>
                <Card>
                  <h3 className="mb-4 font-semibold text-white tracking-tight border-b border-white/5 pb-3">Details</h3>
                  <dl className="space-y-4 text-sm">
                    <div className="flex justify-between items-center">
                      <dt className="text-slate-400">Owner</dt>
                      <dd className="font-semibold text-white">{lead.owner?.full_name || "—"}</dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="text-slate-400">Created</dt>
                      <dd className="text-slate-300">{formatDateTime(lead.created_at)}</dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="text-slate-400">Updated</dt>
                      <dd className="text-slate-300">{formatDateTime(lead.updated_at)}</dd>
                    </div>
                  </dl>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card padding={false} className="overflow-hidden">
                  <div className="border-b border-white/5 px-6 py-4 bg-white/[0.02]">
                    <h3 className="font-semibold text-white tracking-tight">Change History</h3>
                  </div>
                  {history.length === 0 ? (
                    <p className="py-10 text-center text-sm text-slate-500">No changes recorded</p>
                  ) : (
                    <div className="max-h-80 overflow-y-auto divide-y divide-white/5 custom-scrollbar">
                      {history.map((h) => (
                        <div key={h.id} className="px-6 py-4 text-xs hover:bg-white/[0.02] transition-colors">
                          <p className="font-semibold text-slate-200">
                            {titleCase(h.field_changed)} changed
                          </p>
                          <p className="text-slate-400 mt-1">
                            <span className="line-through opacity-50">{h.old_value || "—"}</span> <span className="text-brand-400 mx-1">→</span> <span className="text-emerald-400 font-medium">{h.new_value || "—"}</span>
                          </p>
                          <p className="mt-2 text-[10px] text-slate-500 uppercase tracking-wider">{formatDateTime(h.created_at)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                {id && <FileAttachmentWidget entityType="lead" entityId={id} />}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      <LeadFormModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        onSubmit={handleUpdate}
        title="Edit Lead"
        initial={{
          name: lead.name,
          email: lead.email || "",
          phone: lead.phone || "",
          source: lead.source,
          stage: lead.stage,
          lead_company: lead.lead_company || "",
          notes: lead.notes || "",
        }}
      />

      <Modal
        open={showActivity}
        onClose={() => setShowActivity(false)}
        title="Log Activity"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowActivity(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddActivity}>Save Activity</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Type"
            options={ACTIVITY_TYPES.map((t) => ({ value: t, label: titleCase(t) }))}
            value={activityForm.activity_type}
            onChange={(e) =>
              setActivityForm({
                ...activityForm,
                activity_type: e.target.value as ActivityType,
              })
            }
          />
          <Input
            label="Title"
            value={activityForm.title}
            onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
            required
          />
          <Textarea
            label="Description"
            value={activityForm.description}
            onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
          />
        </div>
      </Modal>
    </>
  );
}
