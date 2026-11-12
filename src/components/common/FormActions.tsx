import { LoaderCircle } from 'lucide-react';

interface FormActionsProps {
  onCancel: () => void;
  submitLabel: string;
  isSaving: boolean;
}

export function FormActions({
  onCancel,
  submitLabel,
  isSaving,
}: FormActionsProps) {
  return (
    <div className="flex flex-col-reverse gap-3 border-t border-slate-800 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
      <button
        className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-700"
        disabled={isSaving}
        onClick={onCancel}
        type="button"
      >
        Cancelar
      </button>
      <button
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isSaving}
        type="submit"
      >
        {isSaving && <LoaderCircle className="animate-spin" size={16} />}
        {isSaving ? 'Salvando...' : submitLabel}
      </button>
    </div>
  );
}
