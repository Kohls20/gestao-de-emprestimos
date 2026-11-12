import { HandCoins } from 'lucide-react';

export function Header() {
  return (
    <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-5 py-4 sm:px-8">
      <a href="/" className="flex items-center gap-3" aria-label="P2P Ledger - início">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
          <HandCoins size={21} strokeWidth={2.2} />
        </span>
        <span>
          <span className="block text-base font-bold tracking-tight text-ink-950">
            P2P Ledger
          </span>
          <span className="block text-xs text-slate-400">
            Seus acordos, organizados
          </span>
        </span>
      </a>
      <div className="hidden text-sm font-medium text-slate-400 sm:block">
        Controle financeiro pessoal
      </div>
    </header>
  );
}
