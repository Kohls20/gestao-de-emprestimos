export interface Person {
  id: string;
  name: string;
  phone?: string;
  notes?: string;
  createdAt: string;
}

export type TransactionType =
  | 'LEND'
  | 'BORROW'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_MADE';

export type TransactionStatus = 'PENDING' | 'PARTIAL' | 'PAID';

export interface Transaction {
  id: string;
  personId: string;
  type: TransactionType;
  amount: number;
  date: string;
  description: string;
  status: TransactionStatus;
  category: string;
  dueDate?: string;
}

export interface LedgerData {
  persons: Person[];
  transactions: Transaction[];
}

const transactionTypes: TransactionType[] = [
  'LEND',
  'BORROW',
  'PAYMENT_RECEIVED',
  'PAYMENT_MADE',
];

const transactionStatuses: TransactionStatus[] = ['PENDING', 'PARTIAL', 'PAID'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isTransactionType(value: unknown): value is TransactionType {
  return transactionTypes.some((type) => type === value);
}

function isTransactionStatus(value: unknown): value is TransactionStatus {
  return transactionStatuses.some((status) => status === value);
}

function isValidDate(value: string): boolean {
  return value.length > 0 && !Number.isNaN(Date.parse(value));
}

export function isLedgerData(value: unknown): value is LedgerData {
  if (!isRecord(value) || !Array.isArray(value.persons) || !Array.isArray(value.transactions)) {
    return false;
  }

  const validPersons = value.persons.every(
    (person) =>
      isRecord(person) &&
      typeof person.id === 'string' &&
      typeof person.name === 'string' &&
      typeof person.createdAt === 'string' &&
      (person.phone === undefined || typeof person.phone === 'string') &&
      (person.notes === undefined || typeof person.notes === 'string'),
  );

  const personIds = new Set(
    value.persons.flatMap((person) =>
      isRecord(person) && typeof person.id === 'string' ? [person.id] : [],
    ),
  );
  const transactionIds = new Set<string>();

  const validTransactions = value.transactions.every((transaction) => {
    if (
      !isRecord(transaction) ||
      typeof transaction.id !== 'string' ||
      transactionIds.has(transaction.id) ||
      typeof transaction.personId !== 'string' ||
      !personIds.has(transaction.personId) ||
      !isTransactionType(transaction.type) ||
      typeof transaction.amount !== 'number' ||
      !Number.isFinite(transaction.amount) ||
      transaction.amount <= 0 ||
      typeof transaction.date !== 'string' ||
      !isValidDate(transaction.date) ||
      typeof transaction.description !== 'string' ||
      !isTransactionStatus(transaction.status) ||
      typeof transaction.category !== 'string' ||
      (transaction.dueDate !== undefined &&
        (typeof transaction.dueDate !== 'string' ||
          !isValidDate(transaction.dueDate)))
    ) {
      return false;
    }

    transactionIds.add(transaction.id);
    return true;
  });

  return (
    validPersons &&
    personIds.size === value.persons.length &&
    validTransactions
  );
}
