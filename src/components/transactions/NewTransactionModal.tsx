import { useState, type FormEvent } from 'react';
import type {
  Person,
  Transaction,
  TransactionStatus,
  TransactionType,
} from '../../types/ledger';
import { FormActions } from '../common/FormActions';
import {
  fieldAccessibilityProps,
  FormField,
  inputClassName,
} from '../common/FormField';
import { Modal } from '../common/Modal';

export interface NewTransactionFormValues {
  personId: string;
  type: TransactionType;
  amount: number;
  date: string;
  description: string;
  category: string;
  status: TransactionStatus;
}

interface NewTransactionModalProps {
  persons: Person[];
  transaction?: Transaction;
  onClose: () => void;
  onSave: (transaction: NewTransactionFormValues) => void;
}

const transactionTypes: { value: TransactionType; label: string }[] = [
  { value: 'LEND', label: 'Emprestei dinheiro' },
  { value: 'BORROW', label: 'Peguei emprestado' },
  { value: 'PAYMENT_RECEIVED', label: 'Recebi pagamento' },
  { value: 'PAYMENT_MADE', label: 'Fiz pagamento' },
];

function getLocalDateValue(): string {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

interface TransactionErrors {
  personId?: string;
  amount?: string;
  date?: string;
  category?: string;
}

export function NewTransactionModal({
  persons,
  transaction,
  onClose,
  onSave,
}: NewTransactionModalProps) {
  const [personId, setPersonId] = useState(
    transaction?.personId ?? persons[0]?.id ?? '',
  );
  const [type, setType] = useState<TransactionType>(transaction?.type ?? 'LEND');
  const [amount, setAmount] = useState(
    transaction ? String(transaction.amount) : '',
  );
  const [date, setDate] = useState(
    transaction?.date.slice(0, 10) ?? getLocalDateValue,
  );
  const [description, setDescription] = useState(transaction?.description ?? '');
  const [category, setCategory] = useState(transaction?.category ?? '');
  const [status, setStatus] = useState<TransactionStatus>(
    transaction?.status ?? 'PENDING',
  );
  const [errors, setErrors] = useState<TransactionErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amountValue = Number(amount);
    const nextErrors: TransactionErrors = {};

    if (!personId) nextErrors.personId = 'Selecione uma pessoa.';
    if (!amount || !Number.isFinite(amountValue) || amountValue <= 0) {
      nextErrors.amount = 'Informe um valor maior que zero.';
    }
    if (!date) nextErrors.date = 'Informe a data do lançamento.';
    if (!category.trim()) nextErrors.category = 'Informe a categoria.';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const savedStatus =
      transaction === undefined
        ? type === 'PAYMENT_RECEIVED' || type === 'PAYMENT_MADE'
          ? 'PAID'
          : 'PENDING'
        : status;

    setIsSaving(true);
    onSave({
      personId,
      type,
      amount: amountValue,
      date,
      description: description.trim(),
      category: category.trim(),
      status: savedStatus,
    });
  }

  return (
    <Modal
      description={
        transaction
          ? 'Altere os dados do lançamento selecionado.'
          : 'Registre um empréstimo ou pagamento para atualizar seu saldo.'
      }
      onClose={onClose}
      title={transaction ? 'Editar lançamento' : 'Novo lançamento'}
    >
      <form noValidate onSubmit={handleSubmit}>
        <div className="space-y-4 px-5 py-5 sm:px-6">
          <FormField
            error={errors.personId}
            id="transaction-person"
            label="Pessoa"
          >
            <select
              {...fieldAccessibilityProps('transaction-person', errors.personId)}
              className={inputClassName}
              data-autofocus
              id="transaction-person"
              onChange={(event) => {
                setPersonId(event.target.value);
                setErrors((current) => ({ ...current, personId: undefined }));
              }}
              value={personId}
            >
              <option value="">Selecione uma pessoa</option>
              {persons.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField id="transaction-type" label="Tipo">
            <select
              className={inputClassName}
              id="transaction-type"
              onChange={(event) => {
                const nextType = event.target.value as TransactionType;
                setType(nextType);
                if (!transaction) {
                  setStatus(
                    nextType === 'PAYMENT_RECEIVED' ||
                      nextType === 'PAYMENT_MADE'
                      ? 'PAID'
                      : 'PENDING',
                  );
                }
              }}
              value={type}
            >
              {transactionTypes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>
          {transaction && (
            <FormField id="transaction-status" label="Status">
              <select
                className={inputClassName}
                id="transaction-status"
                onChange={(event) =>
                  setStatus(event.target.value as TransactionStatus)
                }
                value={status}
              >
                <option value="PENDING">Pendente</option>
                <option value="PARTIAL">Parcial</option>
                <option value="PAID">Pago</option>
              </select>
            </FormField>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              error={errors.amount}
              id="transaction-amount"
              label="Valor (R$)"
            >
              <input
                {...fieldAccessibilityProps('transaction-amount', errors.amount)}
                className={inputClassName}
                id="transaction-amount"
                min="0.01"
                onChange={(event) => {
                  setAmount(event.target.value);
                  setErrors((current) => ({ ...current, amount: undefined }));
                }}
                placeholder="0,00"
                required
                step="0.01"
                type="number"
                value={amount}
              />
            </FormField>
            <FormField
              error={errors.date}
              id="transaction-date"
              label="Data"
            >
              <input
                {...fieldAccessibilityProps('transaction-date', errors.date)}
                className={inputClassName}
                id="transaction-date"
                onChange={(event) => {
                  setDate(event.target.value);
                  setErrors((current) => ({ ...current, date: undefined }));
                }}
                required
                type="date"
                value={date}
              />
            </FormField>
          </div>
          <FormField
            error={errors.category}
            id="transaction-category"
            label="Categoria"
          >
            <input
              {...fieldAccessibilityProps(
                'transaction-category',
                errors.category,
              )}
              className={inputClassName}
              id="transaction-category"
              onChange={(event) => {
                setCategory(event.target.value);
                setErrors((current) => ({ ...current, category: undefined }));
              }}
              placeholder="Ex.: Pessoal, viagem"
              required
              value={category}
            />
          </FormField>
          <FormField id="transaction-description" label="Descrição (opcional)">
            <textarea
              className={`${inputClassName} min-h-20 resize-y`}
              id="transaction-description"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Adicione detalhes sobre o lançamento"
              rows={2}
              value={description}
            />
          </FormField>
        </div>
        <FormActions
          isSaving={isSaving}
          onCancel={onClose}
          submitLabel={transaction ? 'Salvar alterações' : 'Salvar lançamento'}
        />
      </form>
    </Modal>
  );
}
