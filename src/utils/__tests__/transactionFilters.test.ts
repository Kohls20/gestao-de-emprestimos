import { describe, expect, it } from 'vitest';
import type { Transaction } from '../../types/ledger';
import { filterTransactions } from '../transactionFilters';

const transactions: Transaction[] = [
  {
    id: 'transaction-1',
    personId: 'person-1',
    type: 'LEND',
    amount: 100,
    date: '2026-11-12',
    description: 'Viagem de ferias',
    status: 'PENDING',
    category: 'Pessoal',
  },
  {
    id: 'transaction-2',
    personId: 'person-1',
    type: 'PAYMENT_RECEIVED',
    amount: 25,
    date: '2026-11-12',
    description: 'Parcela recebida',
    status: 'PAID',
    category: 'Viagem',
  },
  {
    id: 'transaction-3',
    personId: 'person-2',
    type: 'BORROW',
    amount: 60,
    date: '2026-11-12',
    description: 'Compra',
    status: 'PARTIAL',
    category: 'Casa',
  },
];

describe('filtros da tabela de lancamentos', () => {
  it('combina pessoa e status selecionados', () => {
    const filtered = filterTransactions(transactions, {
      personId: 'person-1',
      status: 'PENDING',
      searchText: '',
    });

    expect(filtered.map((transaction) => transaction.id)).toEqual([
      'transaction-1',
    ]);
  });

  it('busca texto sem diferenciar maiusculas e minusculas em descricao ou categoria', () => {
    const filtered = filterTransactions(transactions, {
      personId: 'ALL',
      status: 'ALL',
      searchText: '  VIAGEM ',
    });

    expect(filtered.map((transaction) => transaction.id)).toEqual([
      'transaction-1',
      'transaction-2',
    ]);
  });

  it('filtra o status parcial separadamente', () => {
    const filtered = filterTransactions(transactions, {
      personId: 'ALL',
      status: 'PARTIAL',
      searchText: '',
    });

    expect(filtered.map((transaction) => transaction.id)).toEqual([
      'transaction-3',
    ]);
  });
});
