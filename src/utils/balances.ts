import type { Transaction } from '../types/ledger';

export function calculatePersonBalance(
  personId: string,
  transactions: Transaction[],
): number {
  return transactions.reduce((balance, transaction) => {
    if (transaction.personId !== personId) {
      return balance;
    }

    switch (transaction.type) {
      case 'LEND':
      case 'PAYMENT_MADE':
        return balance + transaction.amount;
      case 'BORROW':
      case 'PAYMENT_RECEIVED':
        return balance - transaction.amount;
    }
  }, 0);
}

function calculateBalancesByPerson(transactions: Transaction[]): number[] {
  const personIds = new Set(transactions.map((transaction) => transaction.personId));

  return [...personIds].map((personId) =>
    calculatePersonBalance(personId, transactions),
  );
}

export function calculateTotalToReceive(transactions: Transaction[]): number {
  return calculateBalancesByPerson(transactions).reduce(
    (total, balance) => total + Math.max(balance, 0),
    0,
  );
}

export function calculateTotalToPay(transactions: Transaction[]): number {
  return calculateBalancesByPerson(transactions).reduce(
    (total, balance) => total + Math.max(-balance, 0),
    0,
  );
}
