import { useState, type FormEvent } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { Person, Transaction } from '../../types/ledger';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  fieldAccessibilityProps,
  FormField,
  inputClassName,
} from '../common/FormField';
import { Modal } from '../common/Modal';

interface PeopleManagerProps {
  persons: Person[];
  transactions: Transaction[];
  onClose: () => void;
  onUpdate: (personId: string, name: string) => void;
  onDelete: (personId: string) => void;
}

export function PeopleManager({
  persons,
  transactions,
  onClose,
  onUpdate,
  onDelete,
}: PeopleManagerProps) {
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [error, setError] = useState('');
  const transactionsByPerson = new Map<string, Transaction[]>();

  for (const transaction of transactions) {
    const linkedTransactions =
      transactionsByPerson.get(transaction.personId) ?? [];
    linkedTransactions.push(transaction);
    transactionsByPerson.set(transaction.personId, linkedTransactions);
  }

  const sortedPersons = [...persons].sort((first, second) =>
    first.name.localeCompare(second.name, 'pt-BR'),
  );

  function startEditing(person: Person) {
    setEditingPersonId(person.id);
    setEditingName(person.name);
    setError('');
  }

  function handleUpdate(event: FormEvent<HTMLFormElement>, personId: string) {
    event.preventDefault();
    const trimmedName = editingName.trim();
    if (!trimmedName) {
      setError('Informe o nome da pessoa.');
      return;
    }

    onUpdate(personId, trimmedName);
    setEditingPersonId(null);
    setEditingName('');
    setError('');
  }

  function handleDelete(person: Person, linkedCount: number) {
    const confirmation = linkedCount
      ? linkedCount === 1
        ? `Excluir ${person.name}? O lançamento vinculado também será removido.`
        : `Excluir ${person.name}? Os ${linkedCount} lançamentos vinculados também serão removidos.`
      : `Tem certeza de que deseja excluir ${person.name}?`;
    if (window.confirm(confirmation)) onDelete(person.id);
  }

  return (
    <Modal
      description="Consulte as pessoas cadastradas, edite seus nomes e confira os lançamentos vinculados."
      onClose={onClose}
      title="Gerenciamento de pessoas"
    >
      <div className="px-5 py-5 sm:px-6">
        <p className="mb-4 text-sm text-slate-400">
          {persons.length}{' '}
          {persons.length === 1 ? 'pessoa cadastrada' : 'pessoas cadastradas'}
        </p>
        {sortedPersons.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 px-4 py-8 text-center text-sm text-slate-400">
            Nenhuma pessoa cadastrada. Use “Nova pessoa” para adicionar alguém.
          </div>
        ) : (
          <ul className="divide-y divide-slate-800 rounded-xl border border-slate-800">
            {sortedPersons.map((person) => {
              const linkedTransactions =
                transactionsByPerson.get(person.id) ?? [];
              const isEditing = editingPersonId === person.id;

              return (
                <li className="px-4 py-4" key={person.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <form
                          className="space-y-2"
                          noValidate
                          onSubmit={(event) =>
                            handleUpdate(event, person.id)
                          }
                        >
                          <FormField
                            error={error}
                            id={`person-name-${person.id}`}
                            label="Nome"
                          >
                            <input
                              {...fieldAccessibilityProps(
                                `person-name-${person.id}`,
                                error,
                              )}
                              className={inputClassName}
                              data-autofocus
                              id={`person-name-${person.id}`}
                              onChange={(event) => {
                                setEditingName(event.target.value);
                                setError('');
                              }}
                              value={editingName}
                            />
                          </FormField>
                          <div className="flex gap-2">
                            <button
                              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500"
                              type="submit"
                            >
                              Salvar
                            </button>
                            <button
                              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800"
                              onClick={() => {
                                setEditingPersonId(null);
                                setError('');
                              }}
                              type="button"
                            >
                              Cancelar
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <h3 className="truncate text-sm font-semibold text-slate-100">
                            {person.name}
                          </h3>
                          <p className="mt-1 text-xs text-slate-400">
                            {linkedTransactions.length}{' '}
                            {linkedTransactions.length === 1
                              ? 'lançamento vinculado'
                              : 'lançamentos vinculados'}
                          </p>
                        </>
                      )}
                    </div>
                    {!isEditing && (
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          aria-label={`Editar ${person.name}`}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onClick={() => startEditing(person)}
                          title={`Editar ${person.name}`}
                          type="button"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          aria-label={`Excluir ${person.name}`}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                          onClick={() =>
                            handleDelete(person, linkedTransactions.length)
                          }
                          title={`Excluir ${person.name}`}
                          type="button"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                  {linkedTransactions.length > 0 && (
                    <details className="mt-3 rounded-lg bg-slate-950/60 px-3 py-2">
                      <summary className="cursor-pointer text-xs font-medium text-slate-400 hover:text-slate-200">
                        Ver lançamentos vinculados
                      </summary>
                      <ul className="mt-2 divide-y divide-slate-800">
                        {linkedTransactions.map((transaction) => (
                          <li
                            className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2 text-xs"
                            key={transaction.id}
                          >
                            <span className="text-slate-400">
                              {formatDate(transaction.date)} ·{' '}
                              {transaction.description || transaction.category}
                            </span>
                            <span className="font-medium text-slate-200">
                              {formatCurrency(transaction.amount)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
}
