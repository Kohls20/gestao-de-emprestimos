import type { InputHTMLAttributes, ReactNode } from 'react';

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}

export const inputClassName =
  'mt-1.5 block w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 shadow-sm outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20';

export function FormField({ id, label, error, children }: FormFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div>
      <label className="block text-sm font-medium text-slate-300" htmlFor={id}>
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1.5 text-xs font-medium text-rose-400" id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
}

export function fieldAccessibilityProps(
  id: string,
  error: string | undefined,
): Pick<InputHTMLAttributes<HTMLInputElement>, 'aria-invalid' | 'aria-describedby'> {
  return {
    'aria-invalid': Boolean(error),
    ...(error ? { 'aria-describedby': `${id}-error` } : {}),
  };
}
