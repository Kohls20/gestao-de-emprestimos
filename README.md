# P2P Ledger

Gerencie empréstimos pessoais com mais organização e privacidade. O **P2P Ledger** permite registrar pessoas, acompanhar empréstimos e pagamentos e manter os dados protegidos localmente por criptografia, sem depender de uma conta ou de um serviço externo para armazenar o ledger.

> **Privacidade desde a concepção:** os dados do ledger são criptografados antes de serem gravados no armazenamento local do navegador. Backups também podem ser exportados em formato criptografado.

## Principais funcionalidades

- **Gestão de pessoas e transações:** cadastro, consulta, edição e exclusão de pessoas e registros financeiros.
- **Acompanhamento do ledger:** organização de empréstimos, valores, pagamentos, datas, categorias e situação das transações.
- **Modo escuro:** interface com tema escuro.
- **Gestão dos dados:** exportação e importação de backups protegidos por senha e opção para excluir definitivamente os dados armazenados pelo aplicativo.
- **Uso local:** os dados ficam no navegador do usuário; não é necessário criar uma conta para usar o aplicativo.
- **Privacidade e LGPD:** abordagem de *Privacy by Design*, com minimização da exposição dos dados e criptografia local. Isso representa uma decisão de arquitetura alinhada a princípios de privacidade, não uma certificação ou garantia jurídica de conformidade com a LGPD.

## Arquitetura de segurança

### Armazenamento local criptografado

O ledger é mantido no `localStorage` do navegador em um envelope criptografado — não como JSON legível. A senha mestra não é persistida. Durante o uso, a chave criptográfica derivada é mantida em memória pela aplicação. Como em qualquer aplicação web, um dispositivo ou navegador comprometido pode expor dados enquanto estão desbloqueados.

### Criptografia e derivação de chave

- **Criptografia autenticada:** AES-GCM com chave de 256 bits.
- **Derivação da chave:** PBKDF2 com SHA-256, salt aleatório de 16 bytes e 310.000 iterações na configuração atual.
- **Nonce/IV:** IV aleatório de 12 bytes por operação de criptografia.
- **Implementação:** Web Crypto API nativa do navegador.
- **Integridade:** a autenticação do AES-GCM faz com que alterações no ciphertext ou no IV sejam rejeitadas na descriptografia.
- **Backups:** os dados exportados usam a mesma família de algoritmos e uma senha definida para o backup. A senha do backup é necessária para restaurá-lo; guarde-a separadamente do arquivo.

Essas medidas protegem os dados armazenados e os arquivos exportados, mas não substituem uma senha forte, a segurança do dispositivo ou o gerenciamento cuidadoso dos backups. O `localStorage` é acessível a scripts executados na mesma origem; por isso, prevenção de XSS e proteção da origem são importantes.

### Content Security Policy

O `index.html` define uma CSP para restringir scripts, conexões e outros recursos à própria origem, além de bloquear objetos incorporados. A política permite estilos inline para compatibilidade com o estilo atual da interface. Em produção, recomenda-se configurar CSP também como cabeçalho HTTP no servidor, que oferece controles adicionais e proteção mais consistente do que uma meta tag.

## Testes automatizados e qualidade

A suíte Vitest em [`src/utils/__tests__/crypto.test.ts`](./src/utils/__tests__/crypto.test.ts) valida cenários importantes da criptografia:

- criptografia e descriptografia com AES-GCM-256 e PBKDF2;
- rejeição de senha incorreta, alterada ou vazia;
- rejeição de adulterações no ciphertext, IV e salt;
- geração de salt, IV e ciphertext distintos ao cifrar o mesmo conteúdo novamente;
- exportação e importação de backup sem texto legível dos dados originais.

## Stack tecnológica

- [React](https://react.dev/) e [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite](https://vite.dev/)
- [Web Crypto API](https://developer.mozilla.org/docs/Web/API/Web_Crypto_API)
- [Vitest](https://vitest.dev/)

## Como executar localmente

**Requisitos:** Node.js compatível com a versão do Vite instalada e npm. A Web Crypto API requer um contexto seguro no navegador; `localhost` é considerado seguro pelos navegadores modernos.

1. Clone o repositório e entre na pasta do projeto.
2. Instale as dependências:

   ```bash
   npm install
   ```

3. Inicie o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

4. Execute os testes automatizados:

   ```bash
   npm test
   ```

5. Gere e valide a build de produção:

   ```bash
   npm run build
   ```

## Metodologia de desenvolvimento

Este projeto foi idealizado, arquitetado e validado por mim com uma metodologia de **Vibe Coding / desenvolvimento assistido por IA**. Usei o Gemini no planejamento de requisitos e na elaboração de prompts estruturados, e o GitHub Copilot Agent no apoio à implementação e à execução dos testes. As decisões, revisões e validações do resultado fizeram parte do processo de desenvolvimento.
