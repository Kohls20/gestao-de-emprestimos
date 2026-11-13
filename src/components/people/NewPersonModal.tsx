import { useState, type FormEvent } from 'react';
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
  onClose: () => void;
  onSave: (person: NewPersonFormValues) => void;
}

export function NewPersonModal({ onClose, onSave }: NewPersonModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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

  return (
    <Modal
      description="Adicione alguém para organizar seus empréstimos e pagamentos."
      onClose={onClose}
      title="Cadastrar pessoa"
    >
      <form
        className="space-y-4 px-5 py-5 sm:px-6"
        noValidate
        onSubmit={handleSubmit}
      >
        <FormField error={error} id="person-name" label="Nome">
          <input
            {...fieldAccessibilityProps('person-name', error)}
            className={inputClassName}
            data-autofocus
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
    </Modal>
  );
}
