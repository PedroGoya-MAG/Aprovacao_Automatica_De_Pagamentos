# Portal de Aprovacao de Pagamentos

Front-end corporativo para aprovacao de pagamentos de beneficios, desenvolvido com Next.js App Router, TypeScript e Tailwind CSS. O projeto esta preparado para deploy na Vercel, com suporte a modo demonstracao para apresentacoes fora da VPN, e integrado com os endpoints reais do backend via rotas proxy do Next.js.

## Stack

- Next.js 15 com App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Lucide React

## Estrutura do projeto

```text
.
|-- app
|   |-- api
|   |   `-- aprovacoes
|   |       |-- lotes
|   |       |-- pagamentos
|   |       `-- resumo
|   |-- globals.css
|   |-- layout.tsx
|   |-- loading.tsx
|   `-- page.tsx
|-- components
|   |-- layout
|   |   `-- app-header.tsx
|   |-- payments
|   |   |-- benefit-badge.tsx
|   |   |-- dashboard-shell.tsx
|   |   |-- filters-bar.tsx
|   |   `-- status-badge.tsx
|   `-- ui
|       |-- button.tsx
|       |-- empty-state.tsx
|       |-- skeleton.tsx
|       `-- toast-stack.tsx
|-- lib
|   |-- formatters.ts
|   `-- utils.ts
|-- public
|-- services
|   |-- batch-approval-service.ts
|   |-- batch-selected-approval-service.ts
|   |-- dashboard-service.ts
|   |-- lote-payments-service.ts
|   |-- payment-approval-service.ts
|   |-- payment-details-service.ts
|   |-- payment-rejection-service.ts
|   `-- payment-service.ts
|-- types
|   `-- payments.ts
|-- .env.example
|-- .gitignore
|-- next.config.ts
|-- package.json
|-- postcss.config.mjs
|-- tsconfig.json
`-- README.md
```

## Arquivos principais

- `app/page.tsx`: carrega lotes e resumo iniciais no servidor.
- `app/api/aprovacoes/*`: proxies do Next.js para os webhooks do backend.
- `components/payments/dashboard-shell.tsx`: dashboard principal, cards, tabela de pagamentos, drawer e acoes.
- `services/payment-service.ts`: listagem principal de lotes.
- `services/dashboard-service.ts`: resumo da dashboard no client e no server.
- `services/lote-payments-service.ts`: pagamentos por lote.
- `services/payment-details-service.ts`: detalhe individual do pagamento.
- `services/payment-approval-service.ts`: aprovacao individual.
- `services/payment-rejection-service.ts`: rejeicao individual.
- `services/batch-selected-approval-service.ts`: aprovacao de pagamentos selecionados.
- `services/batch-approval-service.ts`: aprovacao do lote inteiro.

## Como rodar localmente

### 1. Instalar dependencias

```bash
npm install
```

### 2. Criar ambiente local

```bash
cp .env.example .env.local
```

No Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

### 3. Subir a aplicacao

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

## Scripts disponiveis

- `npm run dev`: inicia o ambiente de desenvolvimento.
- `npm run build`: gera o build de producao.
- `npm run start`: sobe o build localmente.
- `npm run typecheck`: valida tipagem TypeScript.

## Variaveis de ambiente

- `NEXT_PUBLIC_PORTAL_TITLE`: titulo exibido no cabecalho.`r`n- `NEXT_PUBLIC_DEMO_MODE`: quando `true`, usa dados locais de demonstracao e nao depende da VPN.
- `NEXT_PUBLIC_APP_ENV`: ambiente exibido ou utilizado pelo projeto, se necessario.
- `NEXT_PUBLIC_APPROVALS_SUMMARY_URL`: endpoint publico do resumo.
- `APPROVALS_SUMMARY_URL`: endpoint server-side do resumo.
- `NEXT_PUBLIC_APPROVALS_BATCHES_URL`: endpoint publico da listagem de lotes.
- `APPROVALS_BATCHES_URL`: endpoint server-side da listagem de lotes.
- `NEXT_PUBLIC_APPROVALS_WEBHOOK_BASE_URL`: base publica dos endpoints de pagamentos e acoes.
- `APPROVALS_WEBHOOK_BASE_URL`: base server-side dos endpoints de pagamentos e acoes.
- `API_AUTH_TOKEN`: token server-side opcional para autenticacao futura.

### Exemplo

```env
NEXT_PUBLIC_PORTAL_TITLE=Portal de Aprovacao de Pagamentos
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_APPROVALS_SUMMARY_URL=https://capn8nwfhmg.azurewebsites.net/webhook/api/aprovacoes/resumo
APPROVALS_SUMMARY_URL=https://capn8nwfhmg.azurewebsites.net/webhook/api/aprovacoes/resumo
NEXT_PUBLIC_APPROVALS_BATCHES_URL=https://capn8nwfhmg.azurewebsites.net/webhook-test/api/aprovacoes/lotes
APPROVALS_BATCHES_URL=https://capn8nwfhmg.azurewebsites.net/webhook-test/api/aprovacoes/lotes
NEXT_PUBLIC_APPROVALS_WEBHOOK_BASE_URL=https://capn8nwfhmg.azurewebsites.net/webhook/603abf2b-0367-4379-b3a7-0407fd7878eb
APPROVALS_WEBHOOK_BASE_URL=https://capn8nwfhmg.azurewebsites.net/webhook/603abf2b-0367-4379-b3a7-0407fd7878eb
API_AUTH_TOKEN=
```

## Deploy na Vercel

### Via painel da Vercel

1. Envie o projeto para GitHub, GitLab ou Bitbucket.
2. Importe o repositorio na Vercel.
3. Deixe o framework como `Next.js`.
4. Configure as variaveis de ambiente do projeto.
5. Execute o deploy.

### Via CLI da Vercel

```bash
npm install -g vercel
vercel
```

Depois, para producao:

```bash
vercel --prod
```

## Compatibilidade com Vercel

- Projeto em Next.js App Router.
- Proxies server-side para os endpoints do backend.
- Variaveis de ambiente compativeis com o modelo da Vercel.
- Estrutura pronta para SSR dinamico e integracao incremental com backend.

