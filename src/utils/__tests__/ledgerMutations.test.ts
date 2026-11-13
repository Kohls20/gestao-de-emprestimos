import { describe, expect, it } from 'vitest';
import type { LedgerData } from '../../types/ledger';
import {
  calculateTotalToPay,
  calculateTotalToReceive,
} from '../balances';
import {
  removePersonFromLedger,
  removeTransactionFromLedger,
  updatePersonInLedger,
  updateTransactionInLedger,
} from '../ledgerMutations';

const ledger: LedgerData = {
  persons: [
    {
      id: 'person-1',
      name: 'Ana',
      phone: '11999999999',
      createdAt: '2026-11-12T12:00:00.000Z',
    },
    {
      id: 'person-2',
      name: 'Bia',
      createdAt: '2026-11-12T12:00:00.000Z',
    },
  ],
  transactions: [
    {
      id: 'transaction-1',
      personId: 'person-1',
      type: 'LEND',
      amount: 100,
      date: '2026-11-12',
      description: 'Emprestimo',
      status: 'PENDING',
      category: 'Pessoal',
    },
    {
      id: 'transaction-2',
      personId: 'person-2',
      type: 'BORROW',
      amount: 40,
      date: '2026-11-12',
      description: 'Emprestimo',
      status: 'PENDING',
      category: 'Pessoal',
    },
  ],
};

describe('mutacoes do ledger', () => {
  it('edita pessoa sem alterar seus lancamentos vinculados', () => {
    const updated = updatePersonInLedger(ledger, 'person-1', {
      name: 'Ana Souza',
    });

    expect(updated.persons[0].name).toBe('Ana Souza');
    expect(updated.persons[0].phone).toBe('11999999999');
    expect(updated.transactions).toEqual(ledger.transactions);
    expect(
      updated.persons.find(
        (person) => person.id === updated.transactions[0].personId,
      )?.name,
    ).toBe('Ana Souza');
  });

  it('exclui pessoa e todos os lancamentos associados, preservando outros', () => {
    const updated = removePersonFromLedger(ledger, 'person-1');

    expect(updated.persons.map((person) => person.id)).toEqual(['person-2']);
    expect(updated.transactions.map((transaction) => transaction.id)).toEqual([
      'transaction-2',
    ]);
  });

  it('edita lancamento e recalcula os totais financeiros', () => {
    const updated = updateTransactionInLedger(ledger, 'transaction-1', {
      amount: 60,
      type: 'PAYMENT_RECEIVED',
      status: 'PAID',
    });

    expect(updated.transactions[0]).toMatchObject({
      amount: 60,
      type: 'PAYMENT_RECEIVED',
      status: 'PAID',
    });
    expect(calculateTotalToReceive(updated.transactions)).toBe(0);
    expect(calculateTotalToPay(updated.transactions)).toBe(100);
  });

  it('exclui lancamento e atualiza os totais financeiros', () => {
    const updated = removeTransactionFromLedger(ledger, 'transaction-1');

    expect(updated.transactions).toHaveLength(1);
    expect(calculateTotalToReceive(updated.transactions)).toBe(0);
    expect(calculateTotalToPay(updated.transactions)).toBe(40);
  });
});
