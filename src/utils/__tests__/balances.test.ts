import { describe, expect, it } from 'vitest';
import type { Transaction } from '../../types/ledger';
import {
  calculatePersonBalance,
  calculateTotalToPay,
  calculateTotalToReceive,
} from '../balances';

const transactions: Transaction[] = [
  {
    id: 'lend-pending',
    personId: 'person-1',
    type: 'LEND',
    amount: 200,
    date: '2026-11-12',
    description: 'Pending loan',
    status: 'PENDING',
    category: 'Personal',
  },
  {
    id: 'payment-paid',
    personId: 'person-1',
    type: 'PAYMENT_RECEIVED',
    amount: 60,
    date: '2026-11-12',
    description: 'Paid installment',
    status: 'PAID',
    category: 'Payment',
  },
  {
    id: 'lend-partial',
    personId: 'person-1',
    type: 'LEND',
    amount: 35,
    date: '2026-11-12',
    description: 'Partially settled loan',
    status: 'PARTIAL',
    category: 'Personal',
  },
  {
    id: 'borrow-pending',
    personId: 'person-2',
    type: 'BORROW',
    amount: 50,
    date: '2026-11-12',
    description: 'Pending debt',
    status: 'PENDING',
    category: 'Personal',
  },
  {
    id: 'borrow-paid',
    personId: 'person-2',
    type: 'BORROW',
    amount: 90,
    date: '2026-11-12',
    description: 'Settled debt',
    status: 'PAID',
    category: 'Personal',
  },
];

describe('saldos de lancamentos pendentes', () => {
  it('exclui lancamentos pagos e parciais dos totais e do saldo por pessoa', () => {
    expect(calculatePersonBalance('person-1', transactions)).toBe(200);
    expect(calculateTotalToReceive(transactions)).toBe(200);
    expect(calculateTotalToPay(transactions)).toBe(50);
  });

  it('retorna totais zerados quando nao ha lancamentos pendentes', () => {
    const settledTransactions = transactions.filter(
      (transaction) => transaction.status !== 'PENDING',
    );

    expect(calculateTotalToReceive(settledTransactions)).toBe(0);
    expect(calculateTotalToPay(settledTransactions)).toBe(0);
  });
});
