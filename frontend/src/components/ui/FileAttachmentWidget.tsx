import { useState, useEffect } from "react";
import { api, getErrorMessage } from "@/lib/api";
import { Button } from "./Button";
import { Trash2, Download, File, Image as ImageIcon, Loader2 } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface Attachment {
  id: string;
  file_name: string;
  file_size: number;
  content_type: string;
  created_at: string;
}

interface FileAttachmentWidgetProps {
  entityType: "lead" | "contact" | "deal" | "invoice";
  entityId: string;
}

export function FileAttachmentWidget({ entityType, entityId }: FileAttachmentWidgetProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const fetchAttachments = async () => {
    try {
      const res = await api.get(`/attachments/${entityType}/${entityId}`);
      setAttachments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttachments();
  }, [entityType, entityId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    // Check size 10MB
    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit.");
      return;
    }

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("entity_type", entityType);
    formData.append("entity_id", entityId);
    formData.append("file", file);

    try {
      await api.post("/attachments/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      await fetchAttachments();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
      // reset input
      e.target.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this attachment?")) return;
    try {
      await api.delete(`/attachments/${id}`);
      setAttachments(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDownload = (id: string) => {
    // Open in new tab which will download or preview based on browser
    const token = localStorage.getItem("access_token");
    window.open(`http://localhost:8000/api/v1/attachments/${id}/download?token=${token}`, "_blank");
  };

  const isImage = (type: string) => type.startsWith("image/");

  return (
    <div className="glass-panel rounded-xl overflow-hidden shadow-glow-crm">
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <h3 className="font-semibold text-white">
          Attachments ({attachments.length})
        </h3>
        <div className="flex items-center gap-2">
          {uploading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
          <Button size="sm" onClick={() => document.getElementById(`upload-${entityId}`)?.click()} disabled={uploading}>
            Upload File
          </Button>
          <input 
            type="file" 
            id={`upload-${entityId}`} 
            className="hidden" 
            accept=".pdf,.docx,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg" 
            onChange={handleUpload} 
          />
        </div>
      </div>
      
      {error && (
        <div className="px-6 py-3 bg-red-500/10 text-red-400 text-sm border-b border-red-500/20">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-6 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
      ) : attachments.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">No attachments found.</p>
      ) : (
        <div className="divide-y divide-white/5">
          {attachments.map((a) => (
            <div key={a.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 text-slate-400">
                {isImage(a.content_type) ? <ImageIcon className="h-5 w-5" /> : <File className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-white" title={a.file_name}>
                  {a.file_name}
                </p>
                <p className="text-xs text-slate-400">
                  {(a.file_size / 1024).toFixed(1)} KB • {formatDateTime(a.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(a.id)}
                  className="p-1.5 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 rounded transition-colors"
                  title="Download / Preview"
                >
                  <Download className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
