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
|   |-- n8n-api.ts
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
- `app/api/aprovacoes/*`: proxies do Next.js para o roteador central do n8n.
- `lib/n8n-api.ts`: camada centralizada para montar e executar chamadas GET e POST no n8n.
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

- NEXT_PUBLIC_PORTAL_TITLE: titulo exibido no cabecalho.
- NEXT_PUBLIC_DEMO_MODE: quando `true`, usa dados locais de demonstracao e nao depende da VPN.
- `NEXT_PUBLIC_APP_ENV`: ambiente exibido ou utilizado pelo projeto, se necessario.
- `NEXT_PUBLIC_N8N_API_URL`: endpoint unico do roteador central do n8n.
- API_AUTH_TOKEN: token server-side opcional para autenticacao futura.

Fora do modo demonstracao, a tela de aprovacoes usa o roteador central do n8n e envia `screen` e `action` para diferenciar cada operacao.

### Exemplo

```env
NEXT_PUBLIC_PORTAL_TITLE=Portal de Aprovacao de Pagamentos
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_N8N_API_URL=https://capn8nwfhmg.azurewebsites.net/webhook/api/router
API_AUTH_TOKEN=
```

### Padrao de chamadas do n8n

GET:

```http
GET {NEXT_PUBLIC_N8N_API_URL}?screen=approvals&action=summary
GET {NEXT_PUBLIC_N8N_API_URL}?screen=approvals&action=batch-payments&loteId=LOT-RES-20131002
```

POST:

```json
{
  "screen": "approvals",
  "action": "reject-payment",
  "pagamentoId": 1094,
  "motivo": "Documento divergente"
}
```

## Deploy na Vercel

### Autenticacao OAuth/OIDC em producao

Este projeto usa uma implementacao OAuth/OIDC propria; ele nao usa NextAuth/Auth.js. Portanto, `NEXTAUTH_URL`,
`NEXTAUTH_SECRET`, `AUTH_SECRET` e `AUTH_TRUST_HOST` nao sao lidos pela aplicacao. A configuracao equivalente e:

- `AUTH_APP_BASE_URL`: origem canonica unica, sem caminho e sem barra final, por exemplo `https://pagamentos.empresa.com.br`.
- `AUTH_IDENTIDADE_REDIRECT_URI`: deve ser exatamente
  `https://pagamentos.empresa.com.br/api/auth/callback` e coincidir, inclusive em esquema, host, caminho e barra final,
  com a URI cadastrada no Identidade.
- `AUTH_IDENTIDADE_LOGOUT_URL`: endpoint de encerramento de sessao do provedor. Quando configurado, o logout
  encerra primeiro a sessao no Identidade e depois inicia um login novo.
- `AUTH_IDENTIDADE_PKCE_ENABLED`: `true` por padrao. Use `false` somente se o provedor confirmar que nao suporta
  PKCE S256.
- `AUTH_IDENTIDADE_FORCE_LOGIN`: em homologacao, use `true` para enviar `prompt=login` e `max_age=0` em todo login.
- `AUTH_COOKIE_SECURE`: cookies sao sempre `Secure` em producao. Em desenvolvimento HTTP local, use `false`.
- `AUTH_COOKIE_DOMAIN`: deixe vazio para cookies host-only. Defina apenas quando houver necessidade comprovada de
  compartilhar cookies entre subdominios; nao use o dominio `*.vercel.app`.

Configure a mesma origem canonica no Identidade e na Vercel. Evite alternar entre o dominio customizado, o dominio
automatico `*.vercel.app` e URLs de preview durante uma mesma autenticacao, pois cookies host-only e o `state` nao
sao compartilhados entre esses hosts. Cadastre tambem a URL de retorno de logout exigida pelo provedor. Variaveis
secretas, especialmente `AUTH_IDENTIDADE_CLIENT_SECRET`, devem existir somente no ambiente server-side da Vercel.

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


