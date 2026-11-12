import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import {
  useLocalStorage,
  type EncryptionStatus,
} from '../hooks/useLocalStorage';
import {
  isLedgerData,
  type LedgerData,
  type Person,
  type Transaction,
} from '../types/ledger';
import {
  calculatePersonBalance,
  calculateTotalToPay,
  calculateTotalToReceive,
} from '../utils/balances';
import {
  removePersonFromLedger,
  removeTransactionFromLedger,
  updatePersonInLedger,
  updateTransactionInLedger,
} from '../utils/ledgerMutations';

type NewPerson = Omit<Person, 'id' | 'createdAt'>;
type PersonUpdates = Partial<NewPerson>;
type NewTransaction = Omit<Transaction, 'id'>;
type TransactionUpdates = Partial<NewTransaction>;

interface LedgerContextValue extends LedgerData {
  encryptionStatus: EncryptionStatus;
  hasLegacyData: boolean;
  storageError: string | null;
  setupEncryption: (password: string) => Promise<void>;
  unlockEncryption: (password: string) => Promise<void>;
  replaceData: (data: LedgerData) => void;
  clearAllData: () => void;
  addPerson: (person: NewPerson) => Person;
  updatePerson: (personId: string, updates: PersonUpdates) => void;
  removePerson: (personId: string) => void;
  addTransaction: (transaction: NewTransaction) => Transaction;
  updateTransaction: (
    transactionId: string,
    updates: TransactionUpdates,
  ) => void;
  removeTransaction: (transactionId: string) => void;
  getTotalToReceive: () => number;
  getTotalToPay: () => number;
  getPersonBalance: (personId: string) => number;
}

const STORAGE_KEY = 'p2p-ledger-data';
const EMPTY_LEDGER: LedgerData = { persons: [], transactions: [] };

const LedgerContext = createContext<LedgerContextValue | undefined>(undefined);

function createId(): string {
  return crypto.randomUUID();
}

export function LedgerProvider({ children }: { children: ReactNode }) {
  const {
    value: data,
    setValue: setData,
    status: encryptionStatus,
    hasLegacyData,
    error: storageError,
    setupEncryption,
    unlockEncryption,
    clearStorage,
  } = useLocalStorage<LedgerData>(STORAGE_KEY, EMPTY_LEDGER, {
    isValid: isLedgerData,
  });

  const replaceData = useCallback((nextData: LedgerData) => {
    setData(nextData);
  }, [setData]);

  const addPerson = useCallback((person: NewPerson) => {
    const createdPerson: Person = {
      ...person,
      id: createId(),
      createdAt: new Date().toISOString(),
    };

    setData((current) => ({
      ...current,
      persons: [...current.persons, createdPerson],
    }));

    return createdPerson;
  }, [setData]);

  const updatePerson = useCallback(
    (personId: string, updates: PersonUpdates) => {
      setData((current) => updatePersonInLedger(current, personId, updates));
    },
    [setData],
  );

  const removePerson = useCallback((personId: string) => {
    setData((current) => removePersonFromLedger(current, personId));
  }, [setData]);

  const addTransaction = useCallback((transaction: NewTransaction) => {
    const createdTransaction: Transaction = {
      ...transaction,
      id: createId(),
    };

    setData((current) => ({
      ...current,
      transactions: [...current.transactions, createdTransaction],
    }));

    return createdTransaction;
  }, [setData]);

  const updateTransaction = useCallback(
    (transactionId: string, updates: TransactionUpdates) => {
      setData((current) =>
        updateTransactionInLedger(current, transactionId, updates),
      );
    },
    [setData],
  );

  const removeTransaction = useCallback((transactionId: string) => {
    setData((current) => removeTransactionFromLedger(current, transactionId));
  }, [setData]);

  const getTotalToReceive = useCallback(
    () => calculateTotalToReceive(data.transactions),
    [data.transactions],
  );

  const getTotalToPay = useCallback(
    () => calculateTotalToPay(data.transactions),
    [data.transactions],
  );

  const getPersonBalance = useCallback(
    (personId: string) => calculatePersonBalance(personId, data.transactions),
    [data.transactions],
  );

  const value = useMemo<LedgerContextValue>(
    () => ({
      persons: data.persons,
      transactions: data.transactions,
      encryptionStatus,
      hasLegacyData,
      storageError,
      setupEncryption,
      unlockEncryption,
      replaceData,
      clearAllData: clearStorage,
      addPerson,
      updatePerson,
      removePerson,
      addTransaction,
      updateTransaction,
      removeTransaction,
      getTotalToReceive,
      getTotalToPay,
      getPersonBalance,
    }),
    [
      data,
      encryptionStatus,
      hasLegacyData,
      storageError,
      setupEncryption,
      unlockEncryption,
      replaceData,
      clearStorage,
      addPerson,
      updatePerson,
      removePerson,
      addTransaction,
      updateTransaction,
      removeTransaction,
      getTotalToReceive,
      getTotalToPay,
      getPersonBalance,
    ],
  );

  return (
    <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>
  );
}

export function useLedger(): LedgerContextValue {
  const context = useContext(LedgerContext);

  if (context === undefined) {
    throw new Error('useLedger deve ser usado dentro de um LedgerProvider.');
  }

  return context;
}
