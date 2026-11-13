import { useCallback, useEffect, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Database,
  Plus,
  UserRoundPlus,
  UsersRound,
  Wallet,
  LoaderCircle,
} from 'lucide-react';
import { AuthenticationScreen } from './components/auth/AuthenticationScreen';
import { Header } from './components/dashboard/Header';
import { SummaryCard } from './components/dashboard/SummaryCard';
import { ManageDataModal } from './components/security/ManageDataModal';
import {
  NewPersonModal,
  type NewPersonFormValues,
} from './components/people/NewPersonModal';
import { PeopleManager } from './components/people/PeopleManager';
import {
  NewTransactionModal,
  type NewTransactionFormValues,
} from './components/transactions/NewTransactionModal';
import { TransactionsTable } from './components/transactions/TransactionsTable';
import { useLedger } from './context/LedgerContext';
import { useAuth } from './contexts/AuthContext';
import type { Transaction } from './types/ledger';

type ActiveModal = 'person' | 'people' | 'transaction' | 'data' | null;

function Dashboard() {
  const { user, logout } = useAuth();
  const {
    persons,
    transactions,
    replaceData,
    clearAllData,
    storageError,
    addPerson,
    addTransaction,
    updatePerson,
    removePerson,
    updateTransaction,
    removeTransaction,
    getTotalToPay,
    getTotalToReceive,
  } = useLedger();
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [feedback, setFeedback] = useState('');
  const [logoutError, setLogoutError] = useState('');
  const totalToReceive = getTotalToReceive();
  const totalToPay = getTotalToPay();

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setEditingTransaction(null);
  }, []);

  async function handleLogout() {
    setLogoutError('');
    try {
      await logout();
    } catch (error) {
      setLogoutError(
        error instanceof Error ? error.message : 'Não foi possível sair da conta.',
      );
    }
  }

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
    addTransaction(transaction);
    closeModal();
    setFeedback('Lançamento cadastrado com sucesso.');
  }

  function handleSaveTransaction(transaction: NewTransactionFormValues) {
    if (editingTransaction) {
      updateTransaction(editingTransaction.id, transaction);
      setFeedback('Lançamento atualizado com sucesso.');
    } else {
      handleAddTransaction(transaction);
      return;
    }

    closeModal();
  }

  function handleDeleteTransaction(transaction: Transaction) {
    const personName =
      persons.find((person) => person.id === transaction.personId)?.name ??
      'esta pessoa';
    if (
      window.confirm(
        `Excluir o lançamento de ${personName} no valor de ${transaction.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}?`,
      )
    ) {
      removeTransaction(transaction.id);
      setFeedback('Lançamento excluído com sucesso.');
    }
  }

  function handleUpdatePerson(personId: string, name: string) {
    updatePerson(personId, { name });
    setFeedback('Pessoa atualizada com sucesso.');
  }

  function handleDeletePerson(personId: string) {
    removePerson(personId);
    setFeedback('Pessoa e lançamentos vinculados excluídos com sucesso.');
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
      <Header email={user?.email ?? ''} onLogout={handleLogout} />
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
                onClick={() => setActiveModal('people')}
                type="button"
              >
                <UsersRound size={17} />
                Gerenciar pessoas
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

        <TransactionsTable
          onDelete={handleDeleteTransaction}
          onEdit={(transaction) => {
            setEditingTransaction(transaction);
            setActiveModal('transaction');
          }}
          persons={persons}
          transactions={transactions}
        />
        {logoutError && (
          <p
            className="mt-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200"
            role="alert"
          >
            {logoutError}
          </p>
        )}
        {storageError && (
          <p
            className="mt-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm leading-6 text-rose-200"
            role="alert"
          >
            {storageError} Verifique sua conexão e as regras do Firestore antes
            de continuar editando seus dados.
          </p>
        )}
      </main>
      <footer className="mx-auto max-w-7xl px-5 pb-8 text-center text-xs leading-5 text-slate-500 sm:px-8">
        🔒 Seus dados são sincronizados com segurança na sua conta do Firebase.
      </footer>
      {activeModal === 'person' && (
        <NewPersonModal
          onClose={closeModal}
          onSave={handleAddPerson}
        />
      )}
      {activeModal === 'people' && (
        <PeopleManager
          onClose={closeModal}
          onDelete={handleDeletePerson}
          onUpdate={handleUpdatePerson}
          persons={persons}
          transactions={transactions}
        />
      )}
      {activeModal === 'transaction' && (
        <NewTransactionModal
          onClose={closeModal}
          onSave={handleSaveTransaction}
          persons={persons}
          transaction={editingTransaction ?? undefined}
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
  const { user, loading: authLoading } = useAuth();
  const { loading: ledgerLoading, ready: ledgerReady, storageError } =
    useLedger();

  if (authLoading || (user && ledgerLoading)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        <div className="flex items-center gap-3 text-sm" role="status">
          <LoaderCircle className="animate-spin text-blue-400" size={20} />
          Carregando sua conta e seus dados...
        </div>
      </main>
    );
  }

  if (user && !ledgerReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-slate-100">
        <section className="w-full max-w-lg rounded-2xl border border-rose-500/30 bg-slate-900 p-6 shadow-2xl">
          <h1 className="text-lg font-semibold">Não foi possível carregar seus dados</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {storageError ??
              'Aguarde a conexão com o Firestore para acessar seu ledger.'}
          </p>
          <button
            className="mt-5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
            onClick={() => window.location.reload()}
            type="button"
          >
            Tentar novamente
          </button>
        </section>
      </main>
    );
  }

  return user ? <Dashboard /> : <AuthenticationScreen />;
}
