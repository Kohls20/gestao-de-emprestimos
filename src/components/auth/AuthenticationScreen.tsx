import { useState, type FormEvent } from 'react';
import { FirebaseError } from 'firebase/app';
import { HandCoins, LoaderCircle, LockKeyhole, Mail } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { FormField, inputClassName } from '../common/FormField';

type AuthMode = 'login' | 'register';

function getAuthErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'Este e-mail já possui uma conta. Tente entrar.';
      case 'auth/invalid-email':
        return 'Informe um endereço de e-mail válido.';
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'E-mail ou senha incorretos.';
      case 'auth/weak-password':
        return 'A senha precisa ter pelo menos 6 caracteres.';
      case 'auth/popup-closed-by-user':
        return 'A janela de login do Google foi fechada antes de concluir.';
      case 'auth/unauthorized-domain':
        return 'Este domínio não está autorizado no Firebase Authentication.';
      case 'auth/network-request-failed':
        return 'Falha de conexão. Verifique sua internet e tente novamente.';
      case 'auth/too-many-requests':
        return 'Muitas tentativas. Aguarde um pouco e tente novamente.';
      default:
        return error.message;
    }
  }

  return error instanceof Error
    ? error.message
    : 'Não foi possível autenticar. Tente novamente.';
}

export function AuthenticationScreen() {
  const { login, register, loginWithGoogle, authError } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Informe seu e-mail e sua senha.');
      return;
    }
    if (mode === 'register' && password !== confirmation) {
      setError('As senhas não coincidem.');
      return;
    }
    if (mode === 'register' && password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'register') {
        await register(email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
    } catch (authSubmitError) {
      setError(getAuthErrorMessage(authSubmitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    setError('');
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (authSubmitError) {
      setError(getAuthErrorMessage(authSubmitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  const displayedError = error || (authError ? getAuthErrorMessage(authError) : '');

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-10 text-slate-100">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/30 sm:p-8">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
          <HandCoins size={24} />
        </div>
        <p className="text-sm font-medium text-blue-400">P2P Ledger</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-100">
          Organize seus empréstimos
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Entre ou crie uma conta para acessar seu ledger sincronizado com
          segurança.
        </p>

        <div
          aria-label="Acesso à conta"
          className="mt-6 grid grid-cols-2 rounded-xl bg-slate-950 p-1"
          role="tablist"
        >
          <button
            aria-controls="auth-form"
            aria-selected={mode === 'login'}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
              mode === 'login'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            id="login-tab"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            role="tab"
            type="button"
          >
            Entrar
          </button>
          <button
            aria-controls="auth-form"
            aria-selected={mode === 'register'}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
              mode === 'register'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            id="register-tab"
            onClick={() => {
              setMode('register');
              setError('');
            }}
            role="tab"
            type="button"
          >
            Criar Conta
          </button>
        </div>

        <form
          aria-labelledby={mode === 'login' ? 'login-tab' : 'register-tab'}
          className="mt-5 space-y-4"
          id="auth-form"
          noValidate
          onSubmit={handleSubmit}
          role="tabpanel"
        >
          <FormField id="auth-email" label="E-mail">
            <div className="relative">
              <Mail
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                size={17}
              />
              <input
                autoComplete="email"
                className={`${inputClassName} pl-10`}
                id="auth-email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="voce@exemplo.com"
                required
                type="email"
                value={email}
              />
            </div>
          </FormField>
          <FormField id="auth-password" label="Senha">
            <div className="relative">
              <LockKeyhole
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                size={17}
              />
              <input
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                className={`${inputClassName} pl-10`}
                id="auth-password"
                minLength={mode === 'register' ? 6 : undefined}
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </div>
          </FormField>
          {mode === 'register' && (
            <FormField id="auth-password-confirmation" label="Confirme a senha">
              <div className="relative">
                <LockKeyhole
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  size={17}
                />
                <input
                  autoComplete="new-password"
                  className={`${inputClassName} pl-10`}
                  id="auth-password-confirmation"
                  onChange={(event) => setConfirmation(event.target.value)}
                  required
                  type="password"
                  value={confirmation}
                />
              </div>
            </FormField>
          )}

          {displayedError && (
            <p
              className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200"
              role="alert"
            >
              {displayedError}
            </p>
          )}

          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting && <LoaderCircle className="animate-spin" size={17} />}
            {isSubmitting
              ? 'Aguarde...'
              : mode === 'login'
                ? 'Entrar com e-mail'
                : 'Criar conta'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-slate-800" />
          <span className="text-xs text-slate-500">ou</span>
          <span className="h-px flex-1 bg-slate-800" />
        </div>

        <button
          className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          onClick={handleGoogleLogin}
          type="button"
        >
          <span
            aria-hidden="true"
            className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-sm font-bold text-blue-600"
          >
            G
          </span>
          Continuar com Google
        </button>
      </section>
    </main>
  );
}
