import type { LucideIcon } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface SummaryCardProps {
  title: string;
  amount: number;
  description: string;
  icon: LucideIcon;
  tone: 'green' | 'rose' | 'blue';
}

const toneStyles = {
  green: 'bg-emerald-500/10 text-emerald-400',
  rose: 'bg-rose-500/10 text-rose-400',
  blue: 'bg-blue-500/10 text-blue-400',
};

export function SummaryCard({
  title,
  amount,
  description,
  icon: Icon,
  tone,
}: SummaryCardProps) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-card sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-ink-500">{title}</p>
          <p className="mt-3 text-2xl font-bold tracking-tight text-ink-950 sm:text-3xl">
            {formatCurrency(amount)}
          </p>
          <p className="mt-2 text-xs text-slate-400">{description}</p>
        </div>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${toneStyles[tone]}`}>
          <Icon size={20} strokeWidth={2} />
        </span>
      </div>
    </article>
  );
}
