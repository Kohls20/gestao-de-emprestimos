import type {
  LedgerData,
  Person,
  Transaction,
} from '../types/ledger';

type PersonUpdates = Partial<Omit<Person, 'id' | 'createdAt'>>;
type TransactionUpdates = Partial<Omit<Transaction, 'id'>>;

export function updatePersonInLedger(
  data: LedgerData,
  personId: string,
  updates: PersonUpdates,
): LedgerData {
  return {
    ...data,
    persons: data.persons.map((person) =>
      person.id === personId ? { ...person, ...updates } : person,
    ),
  };
}

export function removePersonFromLedger(
  data: LedgerData,
  personId: string,
): LedgerData {
  return {
    persons: data.persons.filter((person) => person.id !== personId),
    transactions: data.transactions.filter(
      (transaction) => transaction.personId !== personId,
    ),
  };
}

export function updateTransactionInLedger(
  data: LedgerData,
  transactionId: string,
  updates: TransactionUpdates,
): LedgerData {
  return {
    ...data,
    transactions: data.transactions.map((transaction) =>
      transaction.id === transactionId
        ? { ...transaction, ...updates }
        : transaction,
    ),
  };
}

export function removeTransactionFromLedger(
  data: LedgerData,
  transactionId: string,
): LedgerData {
  return {
    ...data,
    transactions: data.transactions.filter(
      (transaction) => transaction.id !== transactionId,
    ),
  };
}
