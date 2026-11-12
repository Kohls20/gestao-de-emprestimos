import { HandCoins, LogOut } from 'lucide-react';

interface HeaderProps {
  email: string;
  onLogout: () => void;
}

export function Header({ email, onLogout }: HeaderProps) {
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
      <div className="flex items-center gap-3">
        <span className="hidden max-w-48 truncate text-sm text-slate-400 sm:block">
          {email}
        </span>
        <button
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={onLogout}
          type="button"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  );
}
