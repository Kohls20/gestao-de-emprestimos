import { useState, type ChangeEvent } from 'react';
import { Download, FileUp, ShieldAlert, Trash2 } from 'lucide-react';
import type { LedgerData } from '../../types/ledger';
import { isLedgerData } from '../../types/ledger';
import {
  decryptJsonWithPassword,
  encryptJsonWithPassword,
  isEncryptedEnvelope,
} from '../../utils/crypto';
import { FormField, inputClassName } from '../common/FormField';
import { Modal } from '../common/Modal';

interface ManageDataModalProps {
  data: LedgerData;
  storageError: string | null;
  onClose: () => void;
  onImport: (data: LedgerData) => void;
  onClear: () => void;
}

const MAX_BACKUP_SIZE = 10 * 1024 * 1024;
const BACKUP_FORMAT = 'p2p-ledger-backup';

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Não foi possível concluir a operação.';
}

function downloadBackup(content: string): void {
  const file = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = `p2p-ledger-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ManageDataModal({
  data,
  storageError,
  onClose,
  onImport,
  onClear,
}: ManageDataModalProps) {
  const [backupPassword, setBackupPassword] = useState('');
  const [backupConfirmation, setBackupConfirmation] = useState('');
  const [importPassword, setImportPassword] = useState('');
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [confirmationText, setConfirmationText] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setBackupFile(event.target.files?.[0] ?? null);
    setError('');
    setNotice('');
  }

  async function handleExport() {
    setError('');
    setNotice('');
    if (backupPassword.length < 10) {
      setError('Use pelo menos 10 caracteres para proteger o backup.');
      return;
    }
    if (backupPassword !== backupConfirmation) {
      setError('As senhas para o backup não coincidem.');
      return;
    }

    setIsBusy(true);
    try {
      const envelope = await encryptJsonWithPassword(
        data,
        backupPassword,
        'backup',
      );
      downloadBackup(
        JSON.stringify(
          { format: BACKUP_FORMAT, version: 1, encrypted: envelope },
          null,
          2,
        ),
      );
      setBackupPassword('');
      setBackupConfirmation('');
      setNotice('Backup criptografado exportado. Guarde a senha em local seguro.');
    } catch (exportError) {
      setError(getErrorMessage(exportError));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleImport() {
    setError('');
    setNotice('');
    if (!backupFile) {
      setError('Selecione um arquivo de backup.');
      return;
    }
    if (backupFile.size > MAX_BACKUP_SIZE) {
      setError('O arquivo excede o limite de 10 MB.');
      return;
    }
    if (!importPassword) {
      setError('Informe a senha usada para proteger o backup.');
      return;
    }

    setIsBusy(true);
    try {
      const content = await backupFile.text();
      const parsed: unknown = JSON.parse(content);
      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        Array.isArray(parsed) ||
        !('format' in parsed) ||
        parsed.format !== BACKUP_FORMAT ||
        !('version' in parsed) ||
        parsed.version !== 1 ||
        !('encrypted' in parsed) ||
        !isEncryptedEnvelope(parsed.encrypted) ||
        parsed.encrypted.purpose !== 'backup'
      ) {
        throw new Error('O arquivo selecionado não é um backup válido do P2P Ledger.');
      }

      const restored = await decryptJsonWithPassword<unknown>(
        parsed.encrypted,
        importPassword,
        'backup',
      );
      if (!isLedgerData(restored)) {
        throw new Error('O conteúdo do backup não corresponde a dados válidos do ledger.');
      }

      onImport(restored);
      setImportPassword('');
      setNotice('Backup restaurado com sucesso.');
      onClose();
    } catch (importError) {
      setError(getErrorMessage(importError));
    } finally {
      setIsBusy(false);
    }
  }

  function handleClear() {
    if (confirmationText.trim() !== 'APAGAR') {
      setError('Digite APAGAR para confirmar a exclusão permanente.');
      return;
    }

    setError('');
    try {
      onClear();
      onClose();
    } catch (clearError) {
      setError(getErrorMessage(clearError));
    }
  }

  return (
    <Modal
      description="Exporte uma cópia protegida, restaure um backup ou apague os dados deste dispositivo."
      onClose={onClose}
      title="Gerenciar dados"
    >
      <div className="space-y-6 px-5 py-5 sm:px-6">
        {storageError && (
          <p
            className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm leading-5 text-rose-200"
            role="alert"
          >
            {storageError}
          </p>
        )}

        <section className="space-y-3">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
              <Download className="text-blue-400" size={17} />
              Exportar backup criptografado
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              O arquivo usa uma senha própria, necessária para restaurá-lo em
              qualquer dispositivo.
            </p>
          </div>
          <FormField id="backup-password" label="Senha do backup">
            <input
              autoComplete="new-password"
              className={inputClassName}
              id="backup-password"
              onChange={(event) => setBackupPassword(event.target.value)}
              placeholder="Pelo menos 10 caracteres"
              type="password"
              value={backupPassword}
            />
          </FormField>
          <FormField
            id="backup-password-confirm"
            label="Confirme a senha do backup"
          >
            <input
              autoComplete="new-password"
              className={inputClassName}
              id="backup-password-confirm"
              onChange={(event) => setBackupConfirmation(event.target.value)}
              type="password"
              value={backupConfirmation}
            />
          </FormField>
          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:opacity-60"
            disabled={isBusy}
            onClick={handleExport}
            type="button"
          >
            <Download size={16} />
            Exportar Backup (JSON Criptografado)
          </button>
        </section>

        <section className="space-y-3 border-t border-slate-800 pt-5">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
              <FileUp className="text-blue-400" size={17} />
              Importar backup
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              A restauração substitui os dados atuais deste dispositivo.
            </p>
          </div>
          <FormField id="backup-file" label="Arquivo JSON">
            <input
              accept=".json,application/json"
              className="mt-1.5 block w-full text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-700 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-100 hover:file:bg-slate-600"
              id="backup-file"
              onChange={handleFileChange}
              type="file"
            />
          </FormField>
          <FormField id="import-backup-password" label="Senha do backup">
            <input
              autoComplete="off"
              className={inputClassName}
              id="import-backup-password"
              onChange={(event) => setImportPassword(event.target.value)}
              type="password"
              value={importPassword}
            />
          </FormField>
          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-700 disabled:opacity-60"
            disabled={isBusy}
            onClick={handleImport}
            type="button"
          >
            <FileUp size={16} />
            Importar Backup
          </button>
        </section>

        <section className="space-y-3 border-t border-rose-500/20 pt-5">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-rose-300">
              <Trash2 size={17} />
              Apagar todos os dados
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              A exclusão é permanente e remove os dados locais criptografados.
              Exporte um backup antes, se quiser conservar uma cópia.
            </p>
          </div>
          <FormField id="delete-confirmation" label="Digite APAGAR para confirmar">
            <input
              autoComplete="off"
              className={`${inputClassName} border-rose-500/30 focus:border-rose-500 focus:ring-rose-500/20`}
              id="delete-confirmation"
              onChange={(event) => {
                setConfirmationText(event.target.value);
                setError('');
              }}
              value={confirmationText}
            />
          </FormField>
          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20 focus:outline-none focus:ring-4 focus:ring-rose-500/20"
            onClick={handleClear}
            type="button"
          >
            <ShieldAlert size={16} />
            Apagar Todos os Dados
          </button>
        </section>

        {error && (
          <p
            className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200"
            role="alert"
          >
            {error}
          </p>
        )}
        {notice && (
          <p
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200"
            role="status"
          >
            {notice}
          </p>
        )}
        {isBusy && (
          <p className="text-center text-xs text-slate-400" role="status">
            Processando arquivo localmente...
          </p>
        )}
      </div>
    </Modal>
  );
}
