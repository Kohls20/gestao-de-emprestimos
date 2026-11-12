import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User, UserCredential } from 'firebase/auth';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  authError: Error | null;
  login: (email: string, password: string) => Promise<UserCredential>;
  register: (email: string, password: string) => Promise<UserCredential>;
  loginWithGoogle: () => Promise<UserCredential>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<Error | null>(null);

  useEffect(
    () =>
      onAuthStateChanged(
        auth,
        (nextUser) => {
          setUser(nextUser);
          setAuthError(null);
          setLoading(false);
        },
        (error) => {
          setUser(null);
          setAuthError(error);
          setLoading(false);
        },
      ),
    [],
  );

  const login = useCallback(
    (email: string, password: string) =>
      signInWithEmailAndPassword(auth, email, password),
    [],
  );

  const register = useCallback(
    (email: string, password: string) =>
      createUserWithEmailAndPassword(auth, email, password),
    [],
  );

  const loginWithGoogle = useCallback(
    () => signInWithPopup(auth, new GoogleAuthProvider()),
    [],
  );

  const logout = useCallback(() => signOut(auth), []);

  const value = useMemo(
    () => ({ user, loading, authError, login, register, loginWithGoogle, logout }),
    [user, loading, authError, login, register, loginWithGoogle, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider.');
  }

  return context;
}
