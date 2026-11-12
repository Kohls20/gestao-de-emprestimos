import { useState, type FormEvent } from 'react';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { inputClassName } from '../common/FormField';
import type { EncryptionStatus } from '../../hooks/useLocalStorage';

interface EncryptionGateProps {
  status: EncryptionStatus;
  hasLegacyData: boolean;
  storageError: string | null;
  onSetup: (password: string) => Promise<void>;
  onUnlock: (password: string) => Promise<void>;
}

export function EncryptionGate({
  status,
  hasLegacyData,
  storageError,
  onSetup,
  onUnlock,
}: EncryptionGateProps) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (status === 'setup') {
      if (password.length < 10) {
        setError('Use uma senha com pelo menos 10 caracteres.');
        return;
      }
      if (password !== confirmation) {
        setError('As senhas não coincidem.');
        return;
      }
    } else if (password.length === 0) {
      setError('Informe sua senha mestra.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (status === 'setup') {
        await onSetup(password);
      } else {
        await onUnlock(password);
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Não foi possível desbloquear os dados. Tente novamente.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const isSetup = status === 'setup';
  const isFatal = status === 'error';

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-10 text-slate-100">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/30 sm:p-8">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
          {isFatal ? <ShieldCheck size={23} /> : <LockKeyhole size={23} />}
        </div>
        <p className="text-sm font-medium text-blue-400">P2P Ledger</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-100">
          {status === 'loading'
            ? 'Preparando seus dados'
            : isFatal
              ? 'Armazenamento indisponível'
              : isSetup
                ? 'Proteja seus dados'
                : 'Desbloqueie seus dados'}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          {status === 'loading'
            ? 'Verificando o armazenamento local criptografado.'
            : isFatal
              ? 'Não foi possível ler os dados locais. Nenhum dado foi apagado.'
              : isSetup
                ? hasLegacyData
                  ? 'Crie uma senha mestra para criptografar e migrar os dados existentes neste dispositivo.'
                  : 'Crie uma senha mestra para criptografar seus dados neste dispositivo.'
                : 'Digite a senha mestra definida neste dispositivo para acessar o ledger.'}
        </p>

        {status === 'loading' && (
          <div
            aria-label="Carregando"
            className="mt-7 h-1.5 overflow-hidden rounded-full bg-slate-800"
            role="status"
          >
            <div className="h-full w-1/2 animate-pulse rounded-full bg-blue-500" />
          </div>
        )}

        {status === 'error' && (
          <div
            className="mt-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm leading-6 text-rose-200"
            role="alert"
          >
            {storageError ?? 'O armazenamento local retornou dados inválidos.'}
            <p className="mt-2 text-rose-200/80">
              Para preservar os dados, não limpe o armazenamento do navegador.
              Se optar por removê-los, use as configurações de dados do site no
              navegador.
            </p>
          </div>
        )}

        {(status === 'setup' || status === 'locked') && (
          <form className="mt-6 space-y-4" noValidate onSubmit={handleSubmit}>
            <div>
              <label
                className="block text-sm font-medium text-slate-300"
                htmlFor="master-password"
              >
                {isSetup ? 'Nova senha mestra' : 'Senha mestra'}
              </label>
              <input
                autoComplete={isSetup ? 'new-password' : 'current-password'}
                autoFocus
                className={inputClassName}
                id="master-password"
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </div>
            {isSetup && (
              <div>
                <label
                  className="block text-sm font-medium text-slate-300"
                  htmlFor="confirm-master-password"
                >
                  Confirme a senha
                </label>
                <input
                  autoComplete="new-password"
                  className={inputClassName}
                  id="confirm-master-password"
                  onChange={(event) => setConfirmation(event.target.value)}
                  required
                  type="password"
                  value={confirmation}
                />
              </div>
            )}
            {isSetup && (
              <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs leading-5 text-amber-200/90">
                A senha não pode ser recuperada. Se esquecê-la, não será
                possível acessar os dados. Guarde-a em um local seguro.
              </p>
            )}
            {error && (
              <p
                className="text-sm font-medium text-rose-400"
                role="alert"
              >
                {error}
              </p>
            )}
            <button
              className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting
                ? 'Aguarde...'
                : isSetup
                  ? 'Criar senha e continuar'
                  : 'Desbloquear'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
