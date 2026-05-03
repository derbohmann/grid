"use client";

import { deleteAllGridDataAction, exportGridDataAction, importGridDataAction } from "@/app/actions";
import { Download, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type ReactNode } from "react";
import { toast } from "sonner";

type BackupDialogProps = {
  open: boolean;
  titleId: string;
  title: string;
  children: ReactNode;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  confirmLabel: string;
  confirmBusyLabel: string;
  confirmIcon?: ReactNode;
};

function BackupDialog({
  open,
  titleId,
  title,
  children,
  busy,
  onClose,
  onConfirm,
  confirmLabel,
  confirmBusyLabel,
  confirmIcon
}: BackupDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      aria-labelledby={titleId}
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
      role="dialog"
      onClick={() => {
        if (!busy) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-white/10 bg-white p-6 text-slate-950 shadow-2xl dark:bg-slate-900 dark:text-slate-50"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id={titleId} className="text-xl font-black">
          {title}
        </h3>
        <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">{children}</div>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button className="btn btn-secondary" type="button" disabled={busy} onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-danger inline-flex items-center gap-2"
            type="button"
            disabled={busy}
            onClick={() => void onConfirm()}
          >
            {confirmIcon}
            {busy ? confirmBusyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminBackupPanel() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [acknowledgeDeleteAll, setAcknowledgeDeleteAll] = useState(false);
  const [confirmingDeleteAll, setConfirmingDeleteAll] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [confirmingImport, setConfirmingImport] = useState(false);
  const [pendingImportJson, setPendingImportJson] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  async function handleExport() {
    setBusy(true);
    try {
      const json = await exportGridDataAction();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `grid-backup-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const text = await file.text();
    event.target.value = "";
    setPendingImportJson(text);
    setConfirmingImport(true);
  }

  async function confirmImportGrid() {
    const json = pendingImportJson;
    if (!json) {
      return;
    }
    setIsImporting(true);
    setBusy(true);
    try {
      await importGridDataAction(json);
      setConfirmingImport(false);
      setPendingImportJson(null);
      router.refresh();
      toast.success("Import complete.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import failed.");
    } finally {
      setIsImporting(false);
      setBusy(false);
    }
  }

  function cancelImportConfirm() {
    if (!isImporting) {
      setConfirmingImport(false);
      setPendingImportJson(null);
    }
  }

  async function confirmDeleteAllGridData() {
    setIsDeletingAll(true);
    try {
      await deleteAllGridDataAction();
      setConfirmingDeleteAll(false);
      setAcknowledgeDeleteAll(false);
      router.refresh();
      toast.success("All categories and items were removed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setIsDeletingAll(false);
    }
  }

  const panelBusy = busy || isImporting || isDeletingAll;

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900">
      <h2 className="text-xl font-black">Backup and restore</h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Export all categories and items as JSON, or import a file to replace the current grid. Import removes existing
        categories and items before restoring from the file.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button className="btn btn-secondary" type="button" disabled={panelBusy} onClick={() => void handleExport()}>
          <Download className="h-4 w-4" />
          Export JSON
        </button>
        <label className="btn btn-secondary inline-flex cursor-pointer items-center gap-2">
          <Upload className="h-4 w-4" />
          Import JSON
          <input
            type="file"
            accept="application/json,.json"
            className="sr-only"
            disabled={panelBusy}
            onChange={(e) => void handleFileChange(e)}
          />
        </label>
      </div>

      <div className="mt-8 rounded-2xl border border-red-200 bg-red-50/60 p-4 dark:border-red-900/50 dark:bg-red-950/25">
        <h3 className="text-sm font-black uppercase tracking-wide text-red-700 dark:text-red-400">Danger zone</h3>
        <p className="mt-2 text-sm text-red-900/90 dark:text-red-100/80">
          Remove every category and every service from the grid. This cannot be undone. Appearance settings and uploaded
          icons in the library are not deleted.
        </p>
        <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm font-medium text-red-950 dark:text-red-50">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-red-300 text-red-600 focus:ring-red-500 dark:border-red-700 dark:bg-slate-900"
            checked={acknowledgeDeleteAll}
            disabled={panelBusy}
            onChange={(e) => setAcknowledgeDeleteAll(e.target.checked)}
          />
          <span>I understand this permanently deletes all categories and items.</span>
        </label>
        <div className="mt-3">
          <button
            className="btn btn-danger inline-flex items-center gap-2"
            type="button"
            disabled={panelBusy || !acknowledgeDeleteAll}
            onClick={() => setConfirmingDeleteAll(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete all grid data
          </button>
        </div>
      </div>

      <BackupDialog
        open={confirmingImport}
        titleId="import-grid-title"
        title="Replace grid from backup?"
        busy={isImporting}
        onClose={cancelImportConfirm}
        onConfirm={confirmImportGrid}
        confirmLabel="Replace grid"
        confirmBusyLabel="Importing..."
        confirmIcon={<Upload className="h-4 w-4" />}
      >
        <p>
          This will remove every category and item currently on the grid and replace them with the contents of the JSON
          file you selected. This cannot be undone.
        </p>
      </BackupDialog>

      <BackupDialog
        open={confirmingDeleteAll}
        titleId="delete-all-grid-title"
        title="Delete all grid data?"
        busy={isDeletingAll}
        onClose={() => {
          if (!isDeletingAll) {
            setConfirmingDeleteAll(false);
          }
        }}
        onConfirm={confirmDeleteAllGridData}
        confirmLabel="Delete everything"
        confirmBusyLabel="Deleting..."
        confirmIcon={<Trash2 className="h-4 w-4" />}
      >
        <p>
          This will permanently remove every category and every item from the grid. Appearance settings and the icon
          library are not removed. This cannot be undone.
        </p>
      </BackupDialog>
    </section>
  );
}
