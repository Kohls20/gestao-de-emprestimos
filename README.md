# P2P Ledger

Gerencie empréstimos pessoais com mais organização. O **P2P Ledger** usa o
Firebase Authentication para login e o Cloud Firestore para manter o ledger
sincronizado por conta entre dispositivos.

## Funcionalidades

- Cadastro, edição e exclusão de pessoas e lançamentos.
- Resumo de valores a receber, a pagar e saldo.
- Login e criação de conta com e-mail/senha ou Google.
- Sincronização do ledger na conta autenticada do Firestore.
- Exportação e importação de backups protegidos por senha.
- Interface em modo escuro.

## Configuração do Firebase

1. Crie ou selecione o projeto Firebase e habilite **Authentication** com os
   provedores **E-mail/senha** e **Google**. Adicione também `localhost` e o
   domínio publicado em **Authorized domains**.
2. Crie o banco de dados do **Cloud Firestore**.
3. Configure as variáveis de ambiente em `.env` na raiz:

   ```dotenv
   VITE_FIREBASE_API_KEY=sua-api-key
   VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=seu-projeto
   VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=seu-sender-id
   VITE_FIREBASE_APP_ID=seu-app-id
   ```

   `.env` é ignorado pelo Git. Configure as mesmas variáveis no ambiente de
   produção da Vercel.
4. Publique as regras que limitam cada documento ao próprio usuário:

   ```bash
   firebase deploy --only firestore:rules --project seu-projeto
   ```

   A configuração está em [`firebase.json`](./firebase.json) e as regras em
   [`firestore.rules`](./firestore.rules). O ledger de cada conta fica em
   `users/{uid}`.

## Executar localmente

Requer uma versão do Node.js compatível com o Vite instalado.

```bash
npm install
npm run dev
```

Para validar testes e build:

```bash
npm test
npm run build
```

## Backups

Os backups exportados são criptografados localmente com AES-GCM-256 e
PBKDF2-SHA-256. A senha do backup é independente da conta Firebase e necessária
para importá-lo. Os dados armazenados no Firestore são protegidos pelas regras
de acesso da conta e pelas proteções da plataforma Firebase.

Dados criptografados localmente por versões anteriores não são migrados
automaticamente para o Firestore. O aplicativo não apaga esse armazenamento
local legado; backups exportados anteriormente podem ser importados após o
login.
