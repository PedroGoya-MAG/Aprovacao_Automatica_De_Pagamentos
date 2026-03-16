# Portal de Aprovacao de Pagamentos

Front-end corporativo para aprovacao de pagamentos de beneficios, desenvolvido com Next.js App Router, TypeScript e Tailwind CSS. O projeto esta pronto para deploy na Vercel, usa dados mockados por padrao e ja possui camada de services preparada para futura integracao com backend.

## Stack

- Next.js 15 com App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Lucide React

## Estrutura final do projeto

```text
.
|-- app
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
|-- mocks
|   |-- payment-api.ts
|   `-- payment-batches.ts
|-- public
|-- services
|   |-- api-config.ts
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

## Arquivos principais revisados

- `app/page.tsx`: entrada da home e carregamento inicial dos lotes.
- `app/loading.tsx`: skeleton loading para experiencia mais profissional.
- `components/payments/dashboard-shell.tsx`: dashboard principal, cards de lote, lista interna, drawer e feedbacks visuais.
- `components/layout/app-header.tsx`: cabecalho executivo da aplicacao.
- `components/ui/toast-stack.tsx`: feedback visual para aprovacoes, rejeicoes e reativacoes.
- `services/payment-service.ts`: camada de services pronta para mocks ou fetch real.
- `services/api-config.ts`: centralizacao de base URL, path da API e headers.
- `mocks/payment-api.ts`: simulacao dos endpoints do dominio de pagamentos.
- `types/payments.ts`: contratos principais de dominio (`Lote`, `Pagamento`, `StatusPagamento`, `TipoBeneficio`).

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

O projeto usa mocks por padrao e pode migrar para backend real apenas mudando variaveis e ajustando a camada de services.

### Obrigatorias para desenvolvimento com mocks

- `NEXT_PUBLIC_PORTAL_TITLE`: titulo exibido no cabecalho.
- `NEXT_PUBLIC_ENABLE_MOCKS`: manter `true` para usar os mocks.

### Necessarias para integracao real com backend

- `NEXT_PUBLIC_API_BASE_URL`: URL base da API.
- `NEXT_PUBLIC_PAYMENTS_API_PATH`: path do recurso de lotes. Exemplo: `/payment-batches`.
- `API_AUTH_TOKEN`: token server-side para autenticacao quando necessario.

### Exemplo

```env
NEXT_PUBLIC_PORTAL_TITLE=Portal de Aprovacao de Pagamentos
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_ENABLE_MOCKS=true
NEXT_PUBLIC_API_BASE_URL=https://api.interna.exemplo.com
NEXT_PUBLIC_PAYMENTS_API_PATH=/payment-batches
API_AUTH_TOKEN=
```

## Arquitetura de integracao

A camada de services foi preparada para alternar entre mocks e API real sem mudar os componentes da interface:

- `services/api-config.ts`: centraliza configuracao da API.
- `services/payment-service.ts`: expoe funcoes de dominio como `getLotes`, `getLoteById`, `aprovarLote`, `aprovarPagamento` e `rejeitarPagamento`.
- `mocks/payment-api.ts`: simula os endpoints com atraso artificial e persistencia em memoria durante a sessao.

Para trocar mocks por backend real:

1. Defina `NEXT_PUBLIC_ENABLE_MOCKS=false`.
2. Configure `NEXT_PUBLIC_API_BASE_URL` e `NEXT_PUBLIC_PAYMENTS_API_PATH`.
3. Ajuste os endpoints reais na camada de services, se necessario.
4. Mantenha os componentes consumindo apenas a camada de dominio.

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
- `next build` validado com sucesso.
- Sem dependencia de `vercel.json` para este cenario.
- Variaveis de ambiente compativeis com o modelo da Vercel.
- Estrutura pronta para SSR/SSG padrao do framework.

## Validacao final

Checklist realizado nesta revisao:

- Estrutura do Next.js revisada.
- Scripts do `package.json` revisados.
- Camada de services e mocks organizada.
- README atualizado.
- Build de producao executado com sucesso.
- Projeto limpo para versionamento (`.gitignore` revisado).