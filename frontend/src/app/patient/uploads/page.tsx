"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload,
  FileText,
  File,
  Image,
  Trash2,
  Eye,
  X,
  CheckCircle2,
  AlertCircle,
  CloudUpload,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

// This is the small UI-facing file shape used by the cards and dialogs on this page.

interface UploadedFile {
  id: number;
  name: string;
  type: "PDF" | "Image" | "Document";
  date: string;
  status: "valid" | "pending" | "processing";
  size: string;
}

// Seed data keeps the uploads screen usable as a demo before full API wiring is finished.

const initialFiles: UploadedFile[] = [
  { id: 1, name: "Blood_Test_Results_Mar2026.pdf", type: "PDF", date: "2026-03-25", size: "1.2 MB", status: "valid" },
  { id: 2, name: "ECG_Report.pdf", type: "PDF", date: "2026-03-15", size: "2.5 MB", status: "valid" },
  { id: 3, name: "Chest_Xray.jpg", type: "Image", date: "2026-03-10", size: "4.8 MB", status: "pending" },
  { id: 4, name: "Lab_Results_Feb.pdf", type: "PDF", date: "2026-02-20", size: "0.8 MB", status: "valid" },
];

const statusConfig: Record<string, { label: string; variant: "success" | "warning" | "info" }> = {
  valid: { label: "Verified", variant: "success" },
  pending: { label: "Pending Review", variant: "warning" },
  processing: { label: "Processing", variant: "info" },
};

function getFileType(name: string): "PDF" | "Image" | "Document" {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf") return "PDF";
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "Image";
  return "Document";
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// The main flow here is simple on purpose: add files, see them in a list,
// inspect one, or remove one.

export default function UploadsPage() {
  const [files, setFiles] = useState<UploadedFile[]>(initialFiles);
  const [dragActive, setDragActive] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [viewFile, setViewFile] = useState<UploadedFile | null>(null);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const newFiles: UploadedFile[] = Array.from(fileList).map((f, i) => ({
      id: Date.now() + i,
      name: f.name,
      type: getFileType(f.name),
      date: new Date().toISOString().split("T")[0],
      size: formatFileSize(f.size),
      status: "processing" as const,
    }));

    setFiles((prev) => [...newFiles, ...prev]);
    setUploadFeedback(`${newFiles.length} file${newFiles.length > 1 ? "s" : ""} uploaded successfully!`);

    // This fake delay is only for demo feel, so the UI shows a believable
    // "processing" moment before moving the file into pending review.
    setTimeout(() => {
      setFiles((prev) =>
        prev.map((f) =>
          newFiles.find((nf) => nf.id === f.id)
            ? { ...f, status: "pending" as const }
            : f
        )
      );
    }, 2000);

    setTimeout(() => setUploadFeedback(null), 3000);
  }, []);

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
    handleFiles(e.dataTransfer.files);
  }

  function handleDelete(id: number) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setDeleteId(null);
  }

  const fileIcon = (type: string) => {
    switch (type) {
      case "PDF":
        return <FileText size={20} className="text-red-400" />;
      case "Image":
        return <Image size={20} className="text-blue-400" />;
      default:
        return <File size={20} className="text-gray-400" />;
    }
  };

  const validCount = files.filter((f) => f.status === "valid").length;
  const pendingCount = files.filter((f) => f.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Page title and purpose. */}
      <div className="pl-12 md:pl-0">
        <h1 className="text-2xl font-bold text-foreground">Medical Reports</h1>
        <p className="text-muted mt-1">Upload and manage your medical documents</p>
      </div>

      {/* Quick counters so the user can scan their report library at a glance. */}
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

      {/* Small success message after a new upload action. */}
      {uploadFeedback && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
          <CheckCircle2 size={16} />
          {uploadFeedback}
        </div>
      )}

      {/* Main upload target. The user can either drag files here or click to open the picker. */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`bg-white rounded-2xl border-2 border-dashed p-10 text-center transition-all cursor-pointer ${
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
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <CloudUpload size={44} className={`mx-auto mb-4 ${dragActive ? "text-primary" : "text-gray-300"}`} />
        <h3 className="font-semibold text-foreground mb-1">
          {dragActive ? "Drop files here" : "Upload a report"}
        </h3>
        <p className="text-sm text-muted mb-3">
          Drag and drop files here, or click to browse
        </p>
        <p className="text-xs text-gray-400">
          PDF, JPG, PNG, DOC up to 20MB
        </p>
      </div>

      {/* Existing files plus quick view/delete actions. */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Uploaded Files
            <span className="ml-2 text-sm font-normal text-muted">({files.length})</span>
          </h2>
        </div>

        {files.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="text-muted">No files uploaded yet</p>
            <p className="text-sm text-gray-400 mt-1">Upload your medical documents to keep them organized</p>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((f) => {
              const status = statusConfig[f.status];
              return (
                <div
                  key={f.id}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow group"
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                    {fileIcon(f.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{f.name}</p>
                    <p className="text-xs text-muted">
                      {f.type} &middot; {f.size} &middot; Uploaded {f.date}
                    </p>
                  </div>
                  <Badge variant={status.variant} size="sm">
                    {status.label}
                  </Badge>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setViewFile(f)}
                      className="p-2 rounded-lg text-muted hover:text-primary hover:bg-teal-50 transition-colors"
                      title="View details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteId(f.id)}
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

      {/* Confirmation step so deleting a medical file is not too easy to do by accident. */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={28} className="text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Delete File?</h3>
            <p className="text-sm text-muted mb-1">
              {files.find((f) => f.id === deleteId)?.name}
            </p>
            <p className="text-sm text-muted mb-6">
              This will permanently remove this file from your records.
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setDeleteId(null)}>
                Keep
              </Button>
              <Button variant="danger" className="flex-1" onClick={() => handleDelete(deleteId)}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Lightweight details view for one file without leaving the main list. */}
      {viewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setViewFile(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-foreground">File Details</h2>
              <button onClick={() => setViewFile(null)} className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-gray-100 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center">
                  {fileIcon(viewFile.type)}
                </div>
                <div>
                  <p className="font-medium text-foreground">{viewFile.name}</p>
                  <Badge variant={statusConfig[viewFile.status].variant} size="sm" className="mt-1">
                    {statusConfig[viewFile.status].label}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">Type</p>
                  <p className="text-sm text-foreground">{viewFile.type}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">Size</p>
                  <p className="text-sm text-foreground">{viewFile.size}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">Upload Date</p>
                  <p className="text-sm text-foreground">{viewFile.date}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">Status</p>
                  <p className="text-sm text-foreground">{statusConfig[viewFile.status].label}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <Button variant="ghost" className="flex-1" onClick={() => setViewFile(null)}>
                Close
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => { setViewFile(null); setDeleteId(viewFile.id); }}
              >
                Delete File
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
