import { useState, type FormEvent } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { Person } from '../../types/ledger';
import { FormActions } from '../common/FormActions';
import {
  fieldAccessibilityProps,
  FormField,
  inputClassName,
} from '../common/FormField';
import { Modal } from '../common/Modal';

export interface NewPersonFormValues {
  name: string;
  phone?: string;
  notes?: string;
}

interface NewPersonModalProps {
  persons: Person[];
  transactionCounts: Record<string, number>;
  onClose: () => void;
  onSave: (person: NewPersonFormValues) => void;
  onUpdate: (personId: string, name: string) => void;
  onDelete: (personId: string) => void;
}

export function NewPersonModal({
  persons,
  transactionCounts,
  onClose,
  onSave,
  onUpdate,
  onDelete,
}: NewPersonModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingError, setEditingError] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Informe o nome da pessoa.');
      return;
    }

    setError('');
    setIsSaving(true);
    onSave({
      name: trimmedName,
      ...(phone.trim() ? { phone: phone.trim() } : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    });
  }

  function handleUpdate(personId: string) {
    const trimmedName = editingName.trim();
    if (!trimmedName) {
      setEditingError('Informe o nome da pessoa.');
      return;
    }

    onUpdate(personId, trimmedName);
    setEditingPersonId(null);
    setEditingName('');
    setEditingError('');
  }

  function handleDelete(person: Person) {
    const linkedTransactions = transactionCounts[person.id] ?? 0;
    const message = linkedTransactions
      ? `Excluir ${person.name}? ${linkedTransactions} ${
          linkedTransactions === 1 ? 'lançamento vinculado será removido' : 'lançamentos vinculados serão removidos'
        } também.`
      : `Tem certeza de que deseja excluir ${person.name}?`;

    if (window.confirm(message)) onDelete(person.id);
  }

  return (
    <Modal
      description="Cadastre e gerencie as pessoas e seus lançamentos vinculados."
      onClose={onClose}
      title="Pessoas"
    >
      <div className="space-y-6 px-5 py-5 sm:px-6">
        <section aria-label="Pessoas cadastradas">
          <h3 className="text-sm font-semibold text-slate-200">
            Pessoas cadastradas ({persons.length})
          </h3>
          {persons.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">
              Nenhuma pessoa cadastrada ainda.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-800 rounded-xl border border-slate-800">
              {persons.map((person) => (
                <li
                  className="flex items-center justify-between gap-3 px-3 py-3"
                  key={person.id}
                >
                  {editingPersonId === person.id ? (
                    <div className="min-w-0 flex-1">
                      <FormField
                        error={editingError}
                        id={`edit-person-${person.id}`}
                        label="Nome"
                      >
                        <input
                          {...fieldAccessibilityProps(
                            `edit-person-${person.id}`,
                            editingError,
                          )}
                          className={inputClassName}
                          data-autofocus
                          id={`edit-person-${person.id}`}
                          onChange={(event) => {
                            setEditingName(event.target.value);
                            setEditingError('');
                          }}
                          value={editingName}
                        />
                      </FormField>
                      <div className="mt-2 flex gap-2">
                        <button
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
                          onClick={() => handleUpdate(person.id)}
                          type="button"
                        >
                          Salvar
                        </button>
                        <button
                          className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                          onClick={() => {
                            setEditingPersonId(null);
                            setEditingError('');
                          }}
                          type="button"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-200">
                          {person.name}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {transactionCounts[person.id] ?? 0}{' '}
                          {(transactionCounts[person.id] ?? 0) === 1
                            ? 'lançamento'
                            : 'lançamentos'}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          aria-label={`Editar ${person.name}`}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-blue-300"
                          onClick={() => {
                            setEditingPersonId(person.id);
                            setEditingName(person.name);
                            setEditingError('');
                          }}
                          title={`Editar ${person.name}`}
                          type="button"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          aria-label={`Excluir ${person.name}`}
                          className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-300"
                          onClick={() => handleDelete(person)}
                          title={`Excluir ${person.name}`}
                          type="button"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <form
          className="space-y-4 border-t border-slate-800 pt-5"
          noValidate
          onSubmit={handleSubmit}
        >
          <h3 className="text-sm font-semibold text-slate-200">Cadastrar pessoa</h3>
          <FormField error={error} id="person-name" label="Nome">
            <input
              {...fieldAccessibilityProps('person-name', error)}
              className={inputClassName}
              data-autofocus={persons.length === 0 ? true : undefined}
              id="person-name"
              onChange={(event) => {
                setName(event.target.value);
                if (error) setError('');
              }}
              placeholder="Ex.: Ana Silva"
              required
              value={name}
            />
          </FormField>
          <FormField id="person-phone" label="Telefone (opcional)">
            <input
              className={inputClassName}
              id="person-phone"
              onChange={(event) => setPhone(event.target.value)}
              placeholder="(11) 99999-9999"
              type="tel"
              value={phone}
            />
          </FormField>
          <FormField id="person-notes" label="Observação (opcional)">
            <textarea
              className={`${inputClassName} min-h-24 resize-y`}
              id="person-notes"
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Anotações sobre a pessoa"
              rows={3}
              value={notes}
            />
          </FormField>
          <FormActions
            isSaving={isSaving}
            onCancel={onClose}
            submitLabel="Salvar pessoa"
          />
        </form>
      </div>
    </Modal>
  );
}
