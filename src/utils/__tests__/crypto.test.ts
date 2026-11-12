import { beforeAll, describe, expect, it } from 'vitest';
import {
  decryptJsonWithPassword,
  deriveEncryptionKey,
  encryptJsonWithPassword,
  type EncryptedEnvelope,
} from '../crypto';
import type { LedgerData } from '../../types/ledger';

const password = 'senha-mestra-segura-123';
const ledgerData: LedgerData = {
  persons: [
    {
      id: 'person-1',
      name: 'Pessoa confidencial',
      phone: '11987654321',
      notes: 'Anotação confidencial',
      createdAt: '2026-11-12T12:00:00.000Z',
    },
  ],
  transactions: [
    {
      id: 'transaction-1',
      personId: 'person-1',
      type: 'LEND',
      amount: 1250,
      date: '2026-11-12',
      description: 'Empréstimo confidencial',
      status: 'PENDING',
      category: 'Pessoal',
    },
  ],
};

function alterBase64Character(value: string): string {
  const replacement = value[0] === 'A' ? 'B' : 'A';
  return `${replacement}${value.slice(1)}`;
}

describe('criptografia de dados e backups', () => {
  let localEnvelope: EncryptedEnvelope;

  beforeAll(async () => {
    localEnvelope = await encryptJsonWithPassword(ledgerData, password, 'local');
  });

  it('criptografa e descriptografa os dados com AES-GCM-256 e PBKDF2', async () => {
    const key = await deriveEncryptionKey(
      password,
      localEnvelope.salt,
      localEnvelope.iterations,
    );

    expect(key.algorithm).toMatchObject({ name: 'AES-GCM', length: 256 });
    expect(localEnvelope.kdf).toBe('PBKDF2-SHA-256');
    expect(localEnvelope.iterations).toBe(310_000);
    await expect(
      decryptJsonWithPassword<LedgerData>(localEnvelope, password, 'local'),
    ).resolves.toEqual(ledgerData);
  });

  it.each(['senha-errada', 'senha-mestra-segura-124', ''])(
    'rejeita senha incorreta ou vazia: %j',
    async (incorrectPassword) => {
      await expect(
        decryptJsonWithPassword(localEnvelope, incorrectPassword, 'local'),
      ).rejects.toThrow();
    },
  );

  it.each(['ciphertext', 'iv', 'salt'] as const)(
    'rejeita dados adulterados no campo %s',
    async (field) => {
      const tamperedEnvelope = {
        ...localEnvelope,
        [field]: alterBase64Character(localEnvelope[field]),
      };

      await expect(
        decryptJsonWithPassword(tamperedEnvelope, password, 'local'),
      ).rejects.toThrow();
    },
  );

  it('usa salt e IV aleatórios para cifrar o mesmo conteúdo', async () => {
    const first = await encryptJsonWithPassword(ledgerData, password, 'local');
    const second = await encryptJsonWithPassword(ledgerData, password, 'local');

    expect(first.ciphertext).not.toBe(second.ciphertext);
    expect(first.iv).not.toBe(second.iv);
    expect(first.salt).not.toBe(second.salt);
  });

  it('exporta e importa backup criptografado sem expor texto dos dados', async () => {
    const encrypted = await encryptJsonWithPassword(
      ledgerData,
      password,
      'backup',
    );
    const exportedFile = JSON.stringify({
      format: 'p2p-ledger-backup',
      version: 1,
      encrypted,
    });

    expect(exportedFile).not.toContain('Pessoa confidencial');
    expect(exportedFile).not.toContain('11987654321');
    expect(exportedFile).not.toContain('Anotação confidencial');
    expect(exportedFile).not.toContain('Empréstimo confidencial');

    const imported = JSON.parse(exportedFile) as {
      format: string;
      version: number;
      encrypted: EncryptedEnvelope;
    };

    expect(imported.format).toBe('p2p-ledger-backup');
    expect(imported.version).toBe(1);
    await expect(
      decryptJsonWithPassword<LedgerData>(
        imported.encrypted,
        password,
        'backup',
      ),
    ).resolves.toEqual(ledgerData);
  });
});
