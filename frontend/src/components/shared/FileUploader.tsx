import { useState, useCallback, useEffect } from "react";
import { UploadCloud, File, FileText, Image as ImageIcon, Download, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";

interface Attachment {
  id: string;
  file_name: string;
  file_path: string;
  content_type: string;
  file_size: number;
  created_at: string;
}

interface FileUploaderProps {
  entityType: "lead" | "contact" | "deal" | "invoice";
  entityId: string;
}

export function FileUploader({ entityType, entityId }: FileUploaderProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAttachments = useCallback(async () => {
    try {
      const { data } = await api.get(`/attachments/${entityType}/${entityId}`);
      setAttachments(data);
    } catch (error) {
      console.error("Failed to fetch attachments:", error);
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds 10MB limit.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("entity_type", entityType);
    formData.append("entity_id", entityId);

    setIsUploading(true);
    try {
      const { data } = await api.post("/attachments/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAttachments([data, ...attachments]);
    } catch (error: any) {
      console.error("Failed to upload file:", error);
      alert(error.response?.data?.detail || "Failed to upload file.");
    } finally {
      setIsUploading(false);
      // Reset input
      event.target.value = "";
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    try {
      const response = await api.get(`/attachments/${attachment.id}/download`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", attachment.file_name);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download file.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;
    try {
      await api.delete(`/attachments/${id}`);
      setAttachments(attachments.filter((a) => a.id !== id));
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete file.");
    }
  };

  const getFileIcon = (contentType: string) => {
    if (contentType.includes("image")) return <ImageIcon className="h-5 w-5 text-blue-500" />;
    if (contentType.includes("pdf")) return <FileText className="h-5 w-5 text-red-500" />;
    if (contentType.includes("word") || contentType.includes("document")) return <FileText className="h-5 w-5 text-blue-600" />;
    return <File className="h-5 w-5 text-slate-500" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (isLoading) {
    return <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-brand-500" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Attachments ({attachments.length})</h3>
        <div>
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileUpload}
            disabled={isUploading}
            accept=".pdf,.docx,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg"
          />
          <label htmlFor="file-upload">
            <Button variant="outline" size="sm" className="cursor-pointer" disabled={isUploading}>
              {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
              Upload File
            </Button>
          </label>
        </div>
      </div>

      {attachments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center">
          <UploadCloud className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No attachments yet. Upload files up to 10MB.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800">
          {attachments.map((attachment) => (
            <li key={attachment.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-2 shrink-0">
                  {getFileIcon(attachment.content_type)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100" title={attachment.file_name}>
                    {attachment.file_name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatSize(attachment.file_size)} • {new Date(attachment.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <Button variant="ghost" size="sm" onClick={() => handleDownload(attachment)} className="h-8 w-8 p-0" title="Download">
                  <Download className="h-4 w-4 text-slate-500" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(attachment.id)} className="h-8 w-8 p-0 hover:text-red-600 hover:bg-red-50" title="Delete">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
