"use client";

import { useState, useCallback, useRef } from "react";
import { parseCSV, mapRowToProject, validateImportProject, ImportProject } from "@/lib/utils/importCsv";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Download, FileUp, Info, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

type Step = "upload" | "preview" | "importing" | "done";

interface ImportResult {
  success: number;
  failed: number;
  errors: { index: number; errors: string[] }[];
}

export function ImportDialog({ open, onOpenChange, onImportComplete }: ImportDialogProps) {
  const [step, setStep] = useState<Step>("upload");
  const [parsedData, setParsedData] = useState<ImportProject[]>([]);
  const [importResult, setImportResult] = useState<ImportResult>({ success: 0, failed: 0, errors: [] });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setStep("upload");
    setParsedData([]);
    setImportResult({ success: 0, failed: 0, errors: [] });
  }, []);

  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen) {
      resetState();
    }
    onOpenChange(newOpen);
  }, [onOpenChange, resetState]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("File harus berformat CSV");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) {
        toast.error("File kosong atau tidak dapat dibaca");
        return;
      }

      try {
        const { rows } = parseCSV(text);
        if (rows.length === 0) {
          toast.error("File CSV tidak memiliki data");
          return;
        }

        const projects = rows.map(mapRowToProject);
        setParsedData(projects);
        setStep("preview");
      } catch {
        toast.error("Gagal memproses file CSV");
      }
    };
    reader.readAsText(file, "UTF-8");

    // Reset file input so same file can be re-selected
    e.target.value = "";
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("File harus berformat CSV");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) {
        toast.error("File kosong atau tidak dapat dibaca");
        return;
      }

      try {
        const { rows } = parseCSV(text);
        if (rows.length === 0) {
          toast.error("File CSV tidak memiliki data");
          return;
        }

        const projects = rows.map(mapRowToProject);
        setParsedData(projects);
        setStep("preview");
      } catch {
        toast.error("Gagal memproses file CSV");
      }
    };
    reader.readAsText(file, "UTF-8");
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleImport = useCallback(async () => {
    setStep("importing");

    try {
      const res = await fetch("/api/projects/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projects: parsedData }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Import gagal");
        setStep("preview");
        return;
      }

      setImportResult(data);
      setStep("done");

      if (data.success > 0) {
        toast.success(`${data.success} project berhasil diimport`);
      }
    } catch {
      toast.error("Gagal mengimport data");
      setStep("preview");
    }
  }, [parsedData]);

  const downloadTemplate = useCallback(() => {
    const template = "Nama Project,Client,Lead,Status,Priority,Category,Budget,Deadline,Catatan\nContoh Project,PT Contoh,John Doe,NEW,MEDIUM,WEB,50000000,2025-12-31,Project contoh";
    const blob = new Blob(["\ufeff" + template], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nextylabs-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const validCount = parsedData.filter((p) => validateImportProject(p).valid).length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-base-card border-base-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-text-main flex items-center gap-2">
            <FileUp className="w-4 h-4 text-brand-primary" />
            Import Project dari CSV
          </DialogTitle>
        </DialogHeader>

        {/* Upload Step */}
        {step === "upload" && (
          <div className="py-6">
            <div
              className="border-2 border-dashed border-base-border rounded-lg p-8 text-center hover:border-brand-primary/50 transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <Upload className="w-10 h-10 text-text-subtle mx-auto mb-3" />
              <p className="text-sm text-text-muted mb-1">
                Drag & drop CSV file atau klik untuk upload
              </p>
              <p className="text-xs text-text-subtle mb-4">
                Format: Nama Project, Client, Lead, Status, Priority, Category, Budget, Deadline
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                ref={fileInputRef}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Pilih File
              </Button>
            </div>
            <div className="mt-4 p-3 bg-base-hover rounded-md">
              <p className="text-xs text-text-muted flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                Download template CSV terlebih dahulu untuk format yang benar
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-xs"
                onClick={downloadTemplate}
              >
                <Download className="w-3 h-3 mr-1" />
                Download Template
              </Button>
            </div>
          </div>
        )}

        {/* Preview Step */}
        {step === "preview" && (
          <div>
            <p className="text-sm text-text-muted mb-3">
              {parsedData.length} project ditemukan ({validCount} valid, {parsedData.length - validCount} tidak valid)
            </p>
            <div className="max-h-64 overflow-y-auto border border-base-border rounded-md">
              <table className="w-full text-xs">
                <thead className="bg-base-hover sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-text-muted font-medium">Nama</th>
                    <th className="px-3 py-2 text-left text-text-muted font-medium">Client</th>
                    <th className="px-3 py-2 text-left text-text-muted font-medium">Status</th>
                    <th className="px-3 py-2 text-left text-text-muted font-medium">Budget</th>
                    <th className="px-3 py-2 text-left text-text-muted font-medium">Validasi</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.slice(0, 10).map((project, i) => {
                    const validation = validateImportProject(project);
                    return (
                      <tr
                        key={i}
                        className={`border-t border-base-border ${!validation.valid ? "bg-red-500/5" : ""}`}
                      >
                        <td className="px-3 py-2 text-text-main">{project.projectName || "-"}</td>
                        <td className="px-3 py-2 text-text-muted">{project.clientName || "-"}</td>
                        <td className="px-3 py-2 text-text-muted">{project.status}</td>
                        <td className="px-3 py-2 text-text-muted">
                          {project.budget > 0 ? project.budget.toLocaleString("id-ID") : "-"}
                        </td>
                        <td className="px-3 py-2">
                          {validation.valid ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <span className="text-red-400 text-[10px]">
                              {validation.errors.join(", ")}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {parsedData.length > 10 && (
                <div className="px-3 py-2 text-center text-[10px] text-text-subtle border-t border-base-border">
                  Dan {parsedData.length - 10} project lainnya...
                </div>
              )}
            </div>
            <div className="flex justify-between mt-4">
              <Button variant="ghost" size="sm" onClick={() => setStep("upload")}>
                Kembali
              </Button>
              <Button size="sm" onClick={handleImport} disabled={validCount === 0}>
                Import {validCount} Project
              </Button>
            </div>
          </div>
        )}

        {/* Importing Step */}
        {step === "importing" && (
          <div className="py-8 text-center">
            <Loader2 className="w-10 h-10 text-brand-primary mx-auto mb-3 animate-spin" />
            <p className="text-sm text-text-main font-medium">Mengimport data...</p>
            <p className="text-xs text-text-muted mt-1">
              Mengimport {parsedData.length} project ke database
            </p>
          </div>
        )}

        {/* Done Step */}
        {step === "done" && (
          <div className="py-6 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <p className="text-sm text-text-main font-medium">Import Selesai</p>
            <p className="text-xs text-text-muted mt-1">
              {importResult.success} berhasil, {importResult.failed} gagal
            </p>
            {importResult.errors.length > 0 && (
              <div className="mt-3 max-h-24 overflow-y-auto text-left">
                {importResult.errors.map((err, i) => (
                  <p key={i} className="text-[10px] text-red-400 px-4">
                    Baris {err.index + 1}: {err.errors.join(", ")}
                  </p>
                ))}
              </div>
            )}
            <Button
              size="sm"
              className="mt-4"
              onClick={() => {
                onOpenChange(false);
                onImportComplete();
              }}
            >
              Selesai
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
