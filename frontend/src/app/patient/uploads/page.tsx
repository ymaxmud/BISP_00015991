"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  CloudUpload,
  Eye,
  File,
  FileText,
  Image as ImageIcon,
  Loader2,
  Trash2,
  X,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { UploadRecord, uploads } from "@/lib/api";

const statusConfig: Record<
  string,
  { label: string; variant: "success" | "warning" | "danger" | "info" }
> = {
  valid: { label: "Verified", variant: "success" },
  pending: { label: "Pending Review", variant: "warning" },
  invalid: { label: "Needs Attention", variant: "danger" },
};

function getFileType(fileName: string, mimeType?: string): "PDF" | "Image" | "Document" {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf" || mimeType === "application/pdf") return "PDF";
  if (
    ["jpg", "jpeg", "png", "gif", "webp"].includes(ext) ||
    mimeType?.startsWith("image/")
  ) {
    return "Image";
  }
  return "Document";
}

function formatDate(value?: string | null): string {
  if (!value) return "Unknown";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fileIcon(type: "PDF" | "Image" | "Document") {
  switch (type) {
    case "PDF":
      return <FileText size={20} className="text-red-400" />;
    case "Image":
      return <ImageIcon size={20} className="text-blue-400" />;
    default:
      return <File size={20} className="text-gray-400" />;
  }
}

export default function UploadsPage() {
  const [files, setFiles] = useState<UploadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [viewFile, setViewFile] = useState<UploadRecord | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await uploads.list();
      setFiles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load uploads.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      setUploading(true);
      setError(null);

      try {
        const selectedFiles = Array.from(fileList);
        await Promise.all(selectedFiles.map((file) => uploads.upload(file)));
        await loadFiles();
        setFeedback(
          `${selectedFiles.length} file${selectedFiles.length > 1 ? "s" : ""} uploaded successfully.`
        );
        window.setTimeout(() => setFeedback(null), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        setUploading(false);
      }
    },
    [loadFiles]
  );

  async function handleDelete(id: number) {
    try {
      setError(null);
      await uploads.remove(id);
      setDeleteId(null);
      setViewFile(null);
      await loadFiles();
      setFeedback("File deleted.");
      window.setTimeout(() => setFeedback(null), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the file.");
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    void handleFiles(e.dataTransfer.files);
  }

  const validCount = files.filter((file) => file.validation_status === "valid").length;
  const pendingCount = files.filter((file) => file.validation_status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="pl-12 md:pl-0">
        <h1 className="text-2xl font-bold text-foreground">Medical Reports</h1>
        <p className="text-muted mt-1">
          Upload and manage the reports tied to your account.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{files.length}</p>
          <p className="text-xs text-muted mt-1">Total Files</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{validCount}</p>
          <p className="text-xs text-muted mt-1">Verified</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-amber-500">{pendingCount}</p>
          <p className="text-xs text-muted mt-1">Pending</p>
        </div>
      </div>

      {feedback && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
          <CheckCircle2 size={16} />
          {feedback}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`bg-white rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
          uploading ? "cursor-wait opacity-80" : "cursor-pointer"
        } ${
          dragActive
            ? "border-primary bg-teal-50/50 scale-[1.01]"
            : "border-gray-200 hover:border-primary/40 hover:bg-gray-50/50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          className="hidden"
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <CloudUpload
          size={44}
          className={`mx-auto mb-4 ${dragActive ? "text-primary" : "text-gray-300"}`}
        />
        <h3 className="font-semibold text-foreground mb-1">
          {uploading ? "Uploading..." : dragActive ? "Drop files here" : "Upload a report"}
        </h3>
        <p className="text-sm text-muted mb-3">
          Drag and drop files here, or click to browse
        </p>
        <p className="text-xs text-gray-400">PDF, JPG, PNG, DOC up to 20MB</p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Uploaded Files
            <span className="ml-2 text-sm font-normal text-muted">({files.length})</span>
          </h2>
          {loading && <Loader2 size={18} className="text-muted animate-spin" />}
        </div>

        {!loading && files.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100 shadow-sm">
            <FileText size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="text-muted">No files uploaded yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Upload your medical documents to keep them organized.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((file) => {
              const type = getFileType(file.file_name, file.mime_type);
              const status = statusConfig[file.validation_status] || {
                label: file.validation_status,
                variant: "info" as const,
              };
              return (
                <div
                  key={file.id}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow group"
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                    {fileIcon(type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">
                      {file.file_name}
                    </p>
                    <p className="text-xs text-muted">
                      {type} &middot; Uploaded {formatDate(file.uploaded_at)}
                      {file.appointment_time
                        ? ` · Visit ${formatDate(file.appointment_time)}`
                        : ""}
                    </p>
                  </div>
                  <Badge variant={status.variant} size="sm">
                    {status.label}
                  </Badge>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setViewFile(file)}
                      className="p-2 rounded-lg text-muted hover:text-primary hover:bg-teal-50 transition-colors"
                      title="View details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteId(file.id)}
                      className="p-2 rounded-lg text-muted hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete file"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDeleteId(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={28} className="text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Delete File?</h3>
            <p className="text-sm text-muted mb-6">
              This permanently removes the selected report from your account.
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setDeleteId(null)}>
                Keep
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => void handleDelete(deleteId)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {viewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setViewFile(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-foreground">File Details</h2>
              <button
                onClick={() => setViewFile(null)}
                className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center">
                  {fileIcon(getFileType(viewFile.file_name, viewFile.mime_type))}
                </div>
                <div>
                  <p className="font-medium text-foreground">{viewFile.file_name}</p>
                  <Badge
                    variant={
                      statusConfig[viewFile.validation_status]?.variant || "info"
                    }
                    size="sm"
                    className="mt-1"
                  >
                    {statusConfig[viewFile.validation_status]?.label ||
                      viewFile.validation_status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">
                    Type
                  </p>
                  <p className="text-sm text-foreground">
                    {getFileType(viewFile.file_name, viewFile.mime_type)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">
                    MIME Type
                  </p>
                  <p className="text-sm text-foreground">
                    {viewFile.mime_type || "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">
                    Upload Date
                  </p>
                  <p className="text-sm text-foreground">{formatDate(viewFile.uploaded_at)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">
                    Appointment
                  </p>
                  <p className="text-sm text-foreground">
                    {viewFile.appointment_time
                      ? formatDate(viewFile.appointment_time)
                      : "Not linked"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <Button variant="ghost" className="flex-1" onClick={() => setViewFile(null)}>
                Close
              </Button>
              <a
                href={viewFile.file}
                target="_blank"
                rel="noreferrer"
                className="flex flex-1 items-center justify-center rounded-lg bg-secondary px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-secondary/90"
              >
                Open File
              </a>
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => {
                  setViewFile(null);
                  setDeleteId(viewFile.id);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
