import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  doc,
  getDocFromServer,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
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
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';

type NewPerson = Omit<Person, 'id' | 'createdAt'>;
type PersonUpdates = Partial<NewPerson>;
type NewTransaction = Omit<Transaction, 'id'>;
type TransactionUpdates = Partial<NewTransaction>;

interface LedgerContextValue extends LedgerData {
  loading: boolean;
  ready: boolean;
  storageError: string | null;
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

const EMPTY_LEDGER: LedgerData = { persons: [], transactions: [] };

const LedgerContext = createContext<LedgerContextValue | undefined>(undefined);

function createId(): string {
  return crypto.randomUUID();
}

export function LedgerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<LedgerData>(EMPTY_LEDGER);
  const [loading, setLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [canSync, setCanSync] = useState(false);
  const lastSnapshot = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      setData(EMPTY_LEDGER);
      setLoadedUserId(null);
      setCanSync(false);
      setStorageError(null);
      setLoading(false);
      lastSnapshot.current = null;
      return;
    }

    const userId = user.uid;
    const ledgerRef = doc(db, 'users', userId);
    setLoading(true);
    setStorageError(null);
    setLoadedUserId(null);
    setCanSync(false);
    lastSnapshot.current = null;

    let active = true;
    let unsubscribe: (() => void) | undefined;

    function applySnapshot(snapshot: Awaited<ReturnType<typeof getDocFromServer>>) {
      let nextData = EMPTY_LEDGER;

      if (snapshot.exists()) {
        const storedData: unknown = snapshot.data();
        if (!isLedgerData(storedData)) {
          setStorageError(
            'Os dados recebidos do Firestore têm um formato inválido e não foram alterados.',
          );
          setLoadedUserId(userId);
          setCanSync(false);
          setLoading(false);
          return false;
        }
        nextData = {
          persons: storedData.persons,
          transactions: storedData.transactions,
        };
      }

      lastSnapshot.current = snapshot.exists()
        ? JSON.stringify(nextData)
        : null;
      setData(nextData);
      setLoadedUserId(userId);
      setCanSync(true);
      setStorageError(null);
      setLoading(false);
      return true;
    }

    void getDocFromServer(ledgerRef)
      .then((snapshot) => {
        if (!active || !applySnapshot(snapshot)) return;

        unsubscribe = onSnapshot(
          ledgerRef,
          (updatedSnapshot) => {
            if (active) applySnapshot(updatedSnapshot);
          },
          (error) => {
            if (!active) return;
            setStorageError(
              `Não foi possível sincronizar o ledger com o Firestore: ${error.message}`,
            );
            setCanSync(false);
          },
        );
      })
      .catch((error: unknown) => {
        if (!active) return;
        const message =
          error instanceof Error ? error.message : 'Erro desconhecido.';
        setStorageError(`Não foi possível carregar o ledger do Firestore: ${message}`);
        setLoadedUserId(userId);
        setLoading(false);
      });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [user?.uid]);

  useEffect(() => {
    if (!user || !canSync || loading || loadedUserId !== user.uid) return;

    const serializedData = JSON.stringify(data);
    if (lastSnapshot.current === serializedData) return;

    lastSnapshot.current = serializedData;
    void setDoc(doc(db, 'users', user.uid), {
      ...data,
      uid: user.uid,
      updatedAt: serverTimestamp(),
    })
      .then(() => setStorageError(null))
      .catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : 'Erro desconhecido.';
        setStorageError(
          `Não foi possível salvar o ledger no Firestore: ${message}`,
        );
      });
  }, [canSync, data, loadedUserId, loading, user]);

  const replaceData = useCallback((nextData: LedgerData) => {
    setData(nextData);
  }, [setData]);

  const clearAllData = useCallback(() => {
    setData(EMPTY_LEDGER);
  }, []);

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

  const ready = Boolean(user && canSync && loadedUserId === user.uid);
  const isLoading = Boolean(
    user && (loading || loadedUserId !== user.uid),
  );
  const value = useMemo<LedgerContextValue>(
    () => ({
      persons: data.persons,
      transactions: data.transactions,
      loading: isLoading,
      ready,
      storageError,
      replaceData,
      clearAllData,
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
      isLoading,
      ready,
      storageError,
      replaceData,
      clearAllData,
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
