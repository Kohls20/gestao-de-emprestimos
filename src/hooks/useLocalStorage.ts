import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createEncryptionSalt,
  decryptJsonWithKey,
  deriveEncryptionKey,
  encryptJsonWithKey,
  isEncryptedEnvelope,
} from '../utils/crypto';

export type EncryptionStatus =
  | 'loading'
  | 'setup'
  | 'locked'
  | 'ready'
  | 'error';

interface UseLocalStorageOptions<T> {
  isValid?: (value: unknown) => value is T;
}

interface UseLocalStorageResult<T> {
  value: T;
  setValue: React.Dispatch<React.SetStateAction<T>>;
  status: EncryptionStatus;
  hasLegacyData: boolean;
  error: string | null;
  setupEncryption: (password: string) => Promise<void>;
  unlockEncryption: (password: string) => Promise<void>;
  clearStorage: () => void;
}

const PBKDF2_ITERATIONS = 310_000;

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'O armazenamento seguro falhou. Tente novamente.';
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions<T> = {},
): UseLocalStorageResult<T> {
  const [value, setValue] = useState<T>(initialValue);
  const [status, setStatus] = useState<EncryptionStatus>('loading');
  const [hasLegacyData, setHasLegacyData] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
  const [salt, setSalt] = useState<string | null>(null);
  const [iterations, setIterations] = useState(PBKDF2_ITERATIONS);
  const legacyValue = useRef<string | null>(null);
  const writeQueue = useRef<Promise<void>>(Promise.resolve());
  const generation = useRef(0);

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(key);
      if (storedValue === null) {
        setStatus('setup');
        return;
      }

      const parsed: unknown = JSON.parse(storedValue);
      if (isEncryptedEnvelope(parsed)) {
        if (parsed.purpose !== 'local') {
          throw new Error('O armazenamento local contém um arquivo incompatível.');
        }
        setStatus('locked');
        return;
      }

      legacyValue.current = storedValue;
      setHasLegacyData(true);
      setStatus('setup');
    } catch (error) {
      setStorageError(getErrorMessage(error));
      setStatus('error');
    }
  }, [key]);

  useEffect(() => {
    if (status !== 'ready' || !encryptionKey || !salt) {
      return;
    }

    const currentGeneration = generation.current;
    writeQueue.current = writeQueue.current
      .then(async () => {
        if (generation.current !== currentGeneration) {
          return;
        }

        const envelope = await encryptJsonWithKey(
          value,
          encryptionKey,
          salt,
          'local',
          iterations,
        );

        if (generation.current !== currentGeneration) {
          return;
        }

        window.localStorage.setItem(key, JSON.stringify(envelope));
        setStorageError(null);
      })
      .catch((error: unknown) => {
        if (generation.current === currentGeneration) {
          setStorageError(
            `Não foi possível salvar os dados criptografados: ${getErrorMessage(error)}`,
          );
        }
      });
  }, [encryptionKey, iterations, key, salt, status, value]);

  const setupEncryption = useCallback(
    async (password: string) => {
      try {
        let initialData = initialValue;
        if (legacyValue.current !== null) {
          const parsed: unknown = JSON.parse(legacyValue.current);
          if (options.isValid && !options.isValid(parsed)) {
            throw new Error(
              'Os dados antigos não têm um formato válido. Eles foram mantidos sem alterações.',
            );
          }
          initialData = parsed as T;
        }

        const nextSalt = createEncryptionSalt();
        const nextKey = await deriveEncryptionKey(
          password,
          nextSalt,
          PBKDF2_ITERATIONS,
        );
        const envelope = await encryptJsonWithKey(
          initialData,
          nextKey,
          nextSalt,
          'local',
          PBKDF2_ITERATIONS,
        );

        window.localStorage.setItem(key, JSON.stringify(envelope));
        generation.current += 1;
        setStorageError(null);
        setValue(initialData);
        setSalt(nextSalt);
        setIterations(PBKDF2_ITERATIONS);
        setEncryptionKey(nextKey);
        setHasLegacyData(false);
        legacyValue.current = null;
        setStatus('ready');
      } catch (error) {
        const message = getErrorMessage(error);
        setStorageError(message);
        throw new Error(message);
      }
    },
    [initialValue, key, options],
  );

  const unlockEncryption = useCallback(
    async (password: string) => {
      try {
        const storedValue = window.localStorage.getItem(key);
        if (storedValue === null) {
          throw new Error('Os dados criptografados não foram encontrados.');
        }

        const parsed: unknown = JSON.parse(storedValue);
        if (!isEncryptedEnvelope(parsed) || parsed.purpose !== 'local') {
          throw new Error('O armazenamento local está inválido.');
        }

        const nextKey = await deriveEncryptionKey(
          password,
          parsed.salt,
          parsed.iterations,
        );
        const decryptedValue = await decryptJsonWithKey<T>(parsed, nextKey);
        if (options.isValid && !options.isValid(decryptedValue)) {
          throw new Error('Os dados descriptografados têm um formato inválido.');
        }

        generation.current += 1;
        setStorageError(null);
        setValue(decryptedValue);
        setSalt(parsed.salt);
        setIterations(parsed.iterations);
        setEncryptionKey(nextKey);
        setStatus('ready');
      } catch (error) {
        const message = getErrorMessage(error);
        setStorageError(message);
        throw new Error(message);
      }
    },
    [key, options],
  );

  const clearStorage = useCallback(() => {
    window.localStorage.removeItem(key);
    generation.current += 1;
    setValue(initialValue);
    setEncryptionKey(null);
    setSalt(null);
    setIterations(PBKDF2_ITERATIONS);
    setHasLegacyData(false);
    setStorageError(null);
    legacyValue.current = null;
    setStatus('setup');
  }, [initialValue, key]);

  return {
    value,
    setValue,
    status,
    hasLegacyData,
    error: storageError,
    setupEncryption,
    unlockEncryption,
    clearStorage,
  };
}
