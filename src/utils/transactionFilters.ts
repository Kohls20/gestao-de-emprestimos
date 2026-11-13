import type { Transaction } from '../types/ledger';

export type TransactionStatusFilter = 'ALL' | Transaction['status'];

export interface TransactionFilters {
  personId: string;
  status: TransactionStatusFilter;
  searchText: string;
}

export function filterTransactions(
  transactions: Transaction[],
  filters: TransactionFilters,
): Transaction[] {
  const searchText = filters.searchText.trim().toLocaleLowerCase('pt-BR');

  return transactions.filter((transaction) => {
    if (filters.personId !== 'ALL' && transaction.personId !== filters.personId) {
      return false;
    }
    if (filters.status !== 'ALL' && transaction.status !== filters.status) {
      return false;
    }
    if (
      searchText &&
      !`${transaction.description} ${transaction.category}`
        .toLocaleLowerCase('pt-BR')
        .includes(searchText)
    ) {
      return false;
    }
    return true;
  });
}
