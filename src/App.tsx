import { useCallback, useEffect, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Database,
  Plus,
  UserRoundPlus,
  Wallet,
} from 'lucide-react';
import { Header } from './components/dashboard/Header';
import { SummaryCard } from './components/dashboard/SummaryCard';
import { ManageDataModal } from './components/security/ManageDataModal';
import { EncryptionGate } from './components/security/EncryptionGate';
import {
  NewPersonModal,
  type NewPersonFormValues,
} from './components/people/NewPersonModal';
import {
  NewTransactionModal,
  type NewTransactionFormValues,
} from './components/transactions/NewTransactionModal';
import { TransactionsTable } from './components/transactions/TransactionsTable';
import { useLedger } from './context/LedgerContext';

type ActiveModal = 'person' | 'transaction' | 'data' | null;

function Dashboard() {
  const {
    persons,
    transactions,
    replaceData,
    clearAllData,
    storageError,
    addPerson,
    addTransaction,
    getTotalToPay,
    getTotalToReceive,
  } = useLedger();
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [feedback, setFeedback] = useState('');
  const totalToReceive = getTotalToReceive();
  const totalToPay = getTotalToPay();

  const closeModal = useCallback(() => setActiveModal(null), []);

  useEffect(() => {
    if (!feedback) return;

    const timeoutId = window.setTimeout(() => setFeedback(''), 3500);
    return () => window.clearTimeout(timeoutId);
  }, [feedback]);

  function handleAddPerson(person: NewPersonFormValues) {
    addPerson(person);
    closeModal();
    setFeedback('Pessoa cadastrada com sucesso.');
  }

  function handleAddTransaction(transaction: NewTransactionFormValues) {
    addTransaction({
      ...transaction,
      status:
        transaction.type === 'PAYMENT_RECEIVED' ||
        transaction.type === 'PAYMENT_MADE'
          ? 'PAID'
          : 'PENDING',
    });
    closeModal();
    setFeedback('Lançamento cadastrado com sucesso.');
  }

  function handleImportData(importedData: {
    persons: typeof persons;
    transactions: typeof transactions;
  }) {
    replaceData(importedData);
    setActiveModal(null);
    setFeedback('Backup restaurado com sucesso.');
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header />
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-400">Visão geral</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-950 sm:text-3xl">
              Seu resumo financeiro
            </h1>
            <p className="mt-2 text-sm text-ink-500">
              Uma visão clara do que você tem a receber e a pagar.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <div className="flex flex-wrap gap-2">
              <button
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-200 shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-700"
                onClick={() => setActiveModal('person')}
                type="button"
              >
                <UserRoundPlus size={17} />
                Nova pessoa
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-200 shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-700"
                onClick={() => setActiveModal('data')}
                type="button"
              >
                <Database size={17} />
                Gerenciar dados
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={persons.length === 0}
                onClick={() => setActiveModal('transaction')}
                title={
                  persons.length === 0
                    ? 'Cadastre uma pessoa antes de adicionar um lançamento'
                    : undefined
                }
                type="button"
              >
                <Plus size={17} />
                Novo lançamento
              </button>
            </div>
            {persons.length === 0 && (
              <p className="text-xs text-slate-400">
                Cadastre uma pessoa para habilitar lançamentos.
              </p>
            )}
          </div>
        </div>

        <section
          aria-label="Resumo financeiro"
          className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          <SummaryCard
            title="Total a receber"
            amount={totalToReceive}
            description="Valores que emprestou"
            icon={ArrowDownLeft}
            tone="green"
          />
          <SummaryCard
            title="Total a pagar"
            amount={totalToPay}
            description="Valores que pegou emprestado"
            icon={ArrowUpRight}
            tone="rose"
          />
          <SummaryCard
            title="Saldo"
            amount={totalToReceive - totalToPay}
            description="A receber menos a pagar"
            icon={Wallet}
            tone="blue"
          />
        </section>

        <TransactionsTable persons={persons} transactions={transactions} />
        {storageError && (
          <p
            className="mt-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm leading-6 text-rose-200"
            role="alert"
          >
            {storageError} Seus dados permanecem disponíveis nesta sessão, mas
            talvez não estejam persistidos no dispositivo. Libere espaço no
            navegador e tente novamente.
          </p>
        )}
      </main>
      <footer className="mx-auto max-w-7xl px-5 pb-8 text-center text-xs leading-5 text-slate-500 sm:px-8">
        🔒 Seus dados estão seguros e criptografados localmente no seu
        dispositivo. Nenhum dado é enviado para servidores externos.
      </footer>
      {activeModal === 'person' && (
        <NewPersonModal onClose={closeModal} onSave={handleAddPerson} />
      )}
      {activeModal === 'transaction' && (
        <NewTransactionModal
          onClose={closeModal}
          onSave={handleAddTransaction}
          persons={persons}
        />
      )}
      {activeModal === 'data' && (
        <ManageDataModal
          data={{ persons, transactions }}
          onClear={clearAllData}
          onClose={closeModal}
          onImport={handleImportData}
          storageError={storageError}
        />
      )}
      {feedback && (
        <div
          aria-live="polite"
          className="fixed bottom-5 right-5 z-[60] flex max-w-[calc(100%-2.5rem)] items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-950 px-4 py-3 text-sm font-medium text-emerald-100 shadow-lg"
          role="status"
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20">
            ✓
          </span>
          {feedback}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const {
    encryptionStatus,
    hasLegacyData,
    storageError,
    setupEncryption,
    unlockEncryption,
  } = useLedger();

  if (encryptionStatus !== 'ready') {
    return (
      <EncryptionGate
        hasLegacyData={hasLegacyData}
        onSetup={setupEncryption}
        onUnlock={unlockEncryption}
        status={encryptionStatus}
        storageError={storageError}
      />
    );
  }

  return <Dashboard />;
}
