import { ArrowDownLeft, ArrowUpRight, ReceiptText } from 'lucide-react';
import type { Person, Transaction } from '../../types/ledger';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface TransactionsTableProps {
  persons: Person[];
  transactions: Transaction[];
}

const transactionLabels: Record<Transaction['type'], string> = {
  LEND: 'Emprestei',
  BORROW: 'Peguei emprestado',
  PAYMENT_RECEIVED: 'Pagamento recebido',
  PAYMENT_MADE: 'Pagamento realizado',
};

const statusLabels: Record<Transaction['status'], string> = {
  PENDING: 'Pendente',
  PARTIAL: 'Parcial',
  PAID: 'Pago',
};

const statusStyles: Record<Transaction['status'], string> = {
  PENDING: 'bg-rose-500/10 text-rose-300',
  PARTIAL: 'bg-amber-500/10 text-amber-300',
  PAID: 'bg-emerald-500/10 text-emerald-300',
};

function amountSign(type: Transaction['type']): 1 | -1 {
  return type === 'BORROW' || type === 'PAYMENT_RECEIVED' ? 1 : -1;
}

export function TransactionsTable({
  persons,
  transactions,
}: TransactionsTableProps) {
  const personsById = new Map(persons.map((person) => [person.id, person.name]));
  const sortedTransactions = [...transactions].sort(
    (first, second) =>
      new Date(second.date).getTime() - new Date(first.date).getTime(),
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-5 py-5 sm:px-6">
        <div>
          <h2 className="font-semibold text-ink-950">Lançamentos recentes</h2>
          <p className="mt-1 text-sm text-ink-500">
            Acompanhe seus empréstimos e pagamentos
          </p>
        </div>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
          {transactions.length} {transactions.length === 1 ? 'lançamento' : 'lançamentos'}
        </span>
      </div>

      {sortedTransactions.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-slate-400">
            <ReceiptText size={22} />
          </span>
          <h3 className="mt-4 text-sm font-semibold text-ink-950">
            Ainda não há lançamentos
          </h3>
          <p className="mt-1 max-w-sm text-sm leading-6 text-ink-500">
            Seus empréstimos, acordos e pagamentos aparecerão aqui quando forem
            cadastrados.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-800/70 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-6 py-3 font-medium">Pessoa</th>
                <th className="px-6 py-3 font-medium">Lançamento</th>
                <th className="px-6 py-3 font-medium">Data</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 text-right font-medium">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {sortedTransactions.map((transaction) => {
                const sign = amountSign(transaction.type);
                const isPositive = sign > 0;
                const Icon = isPositive ? ArrowDownLeft : ArrowUpRight;

                return (
                  <tr key={transaction.id} className="text-slate-300">
                    <td className="px-6 py-4 font-medium text-ink-950">
                      {personsById.get(transaction.personId) ?? 'Pessoa removida'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="block font-medium text-slate-200">
                        {transactionLabels[transaction.type]}
                      </span>
                      <span className="mt-1 block text-xs text-slate-400">
                        {transaction.description || transaction.category}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[transaction.status]}`}>
                        {statusLabels[transaction.status]}
                      </span>
                    </td>
                    <td
                      className={`whitespace-nowrap px-6 py-4 text-right font-semibold ${
                        transaction.type === 'LEND' ||
                        transaction.type === 'PAYMENT_RECEIVED'
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}
                    >
                      <span className="inline-flex items-center gap-1">
                        <Icon size={14} />
                        {formatCurrency(transaction.amount)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
