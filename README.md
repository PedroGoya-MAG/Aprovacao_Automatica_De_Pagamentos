# Portal de Aprovacao de Pagamentos


Aplicacao web corporativa para aprovacao, acompanhamento e consulta de pagamentos de beneficios da MAG Capitalizacao. O projeto usa Next.js App Router, TypeScript e Tailwind CSS, com telas protegidas por OAuth/OIDC quando a autenticacao esta configurada, modo demonstracao com dados locais e integracao server-side com um roteador n8n.

## O que o projeto entrega

- Dashboard de aprovacoes pendentes, com resumo executivo, filtros por beneficio/status, busca, expansao de lotes e detalhe de pagamentos.
- Aprovacao individual, rejeicao com motivo, aprovacao de pagamentos selecionados e aprovacao de lote inteiro.
- Analise local de pagamentos suspeitos no dashboard, considerando valor acima da media, beneficiario repetido e concentracao por beneficiario.
- Historico geral de lotes e pagamentos processados, com filtros por competencia, status, beneficio, resultado e alertas.
- Visao mensal com totais, series diaria/semanal e filtro por tipo de beneficio.
- Tela de tesouraria para consulta de pagamentos importados no PagNet, agrupados por data de importacao.
- Autenticacao OAuth/OIDC propria contra o Identidade, com perfis `ADMIN`, `BENEFICIO` e `TESOURARIA`.
- Modo demonstracao (`NEXT_PUBLIC_DEMO_MODE=true`) para rodar sem backend/VPN.

## Stack

- Node.js `>=20.11.1`
- Next.js 15 com App Router
- React 19
- TypeScript 5
- Tailwind CSS 4 via PostCSS
- Lucide React

## Rotas da aplicacao

| Rota | Tela | Observacao |
| --- | --- | --- |
| `/` | Aprovacoes | Lista lotes pendentes e permite acao conforme perfil. |
| `/historico` | Historico geral | Consulta lotes processados e detalhes de pagamentos historicos. |
| `/visao-mensal` | Visao mensal | Consolida totais e series por competencia. |
| `/tesouraria` | Tesouraria | Consulta pagamentos importados no PagNet. |
| `/api/auth/login` | Login | Inicia o fluxo OAuth/OIDC quando auth esta ativa. |
| `/api/auth/callback` | Callback | Troca o authorization code por tokens e cria a sessao. |
| `/api/auth/logout` | Logout | Limpa cookies locais e, quando configurado, encerra sessao no provedor. |

## Permissoes

A aplicacao le a claim `DashBeneficio` do token e mapeia os valores abaixo:

| Claim | Perfil interno | Permissoes |
| --- | --- | --- |
| `Admin` | `ADMIN` | Acessa todas as telas e pode alterar aprovacoes. |
| `Beneficio` | `BENEFICIO` | Acessa aprovacoes, historico, visao mensal e tesouraria em modo consulta; nao altera aprovacoes. |
| `Tesouraria` | `TESOURARIA` | Acessa apenas a tela de tesouraria. |

Quando `AUTH_ENABLED` esta desativado ou as variaveis minimas do Identidade nao existem, o middleware nao exige login. Quando a autenticacao esta ativa, as rotas de tela e APIs de negocio sao protegidas; chamadas nao autenticadas recebem `401` e perfis sem permissao recebem `403` ou redirecionamento para a rota padrao do perfil.

## Integracao com backend

As chamadas externas ficam concentradas em `lib/n8n-api.ts` e sao feitas server-side para `N8N_API_URL` ou, por compatibilidade, `NEXT_PUBLIC_N8N_API_URL`.

O roteador n8n recebe sempre `screen` e `action`:

### GET

```http
GET {N8N_API_URL}?screen=approvals&action=batches&status=PENDING
GET {N8N_API_URL}?screen=approvals&action=summary
GET {N8N_API_URL}?screen=approvals&action=batch-payments&loteId=LOT-001
GET {N8N_API_URL}?screen=approvals&action=payment-detail&pagamentoId=123
GET {N8N_API_URL}?screen=history&action=batches&onlySuspicious=false
GET {N8N_API_URL}?screen=history&action=summary&onlySuspicious=false
GET {N8N_API_URL}?screen=history&action=batch-payments&loteId=LOT-001
GET {N8N_API_URL}?screen=monthly&action=months
GET {N8N_API_URL}?screen=monthly&action=summary&month=2026-06
GET {N8N_API_URL}?screen=monthly&action=series&month=2026-06
GET {N8N_API_URL}?screen=treasury&action=summary
```

### POST

```json
{
  "screen": "approvals",
  "action": "reject-payment",
  "pagamentoId": 123,
  "motivo": "Documento divergente"
}
```

Acoes POST usadas pela tela de aprovacoes:

- `approvals/approve-payment`
- `approvals/reject-payment`
- `approvals/approve-selected`
- `approvals/approve-batch`

## Estrutura principal

```text
app/
  api/
    aprovacoes/        Route Handlers da tela de aprovacoes.
    auth/              Login, callback e logout OAuth/OIDC.
    historico/         Detalhe de pagamentos historicos por lote.
    visao-mensal/      Resumo e series mensais.
  historico/           Pagina do historico geral.
  tesouraria/          Pagina de consulta PagNet.
  visao-mensal/        Pagina de visao mensal.
  page.tsx             Pagina principal de aprovacoes.
components/
  history/             Interface do historico.
  layout/              Cabecalho e navegacao por perfil.
  monthly/             Interface da visao mensal.
  payments/            Dashboard de aprovacoes.
  treasury/            Interface de tesouraria/PagNet.
  ui/                  Componentes base.
lib/
  auth/                Configuracao, sessao, roles, JWT e OAuth/OIDC.
  demo-data.ts         Dados demo de aprovacoes.
  history-monthly-demo-data.ts
  n8n-api.ts           Cliente server-side do roteador n8n.
  runtime-mode.ts      Leitura do modo demonstracao.
services/
  *-service.ts         Camada de acesso a APIs internas e ao n8n.
types/
  auth.ts
  insights.ts
  payments.ts
  treasury.ts
```

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

Por padrao, `.env.example` vem com `NEXT_PUBLIC_DEMO_MODE=true`, entao a aplicacao roda com dados locais sem depender do n8n.

### 3. Subir a aplicacao

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev`: inicia o ambiente de desenvolvimento.
- `npm run build`: gera o build de producao.
- `npm run start`: sobe o build gerado.
- `npm run typecheck`: valida a tipagem TypeScript.

## Variaveis de ambiente

### Aplicacao e API

- `NEXT_PUBLIC_PORTAL_TITLE`: titulo exibido no cabecalho.
- `NEXT_PUBLIC_APP_ENV`: identificador livre de ambiente.
- `NEXT_PUBLIC_DEMO_MODE`: quando `true`, usa dados locais de demonstracao.
- `N8N_API_URL`: endpoint server-side do roteador central do n8n.
- `NEXT_PUBLIC_N8N_API_URL`: fallback legado para URL do n8n.
- `API_AUTH_TOKEN`: token opcional enviado como `Authorization: Bearer ...` nas chamadas ao n8n.
- `API_REQUEST_TIMEOUT_MS`: timeout obrigatorio das chamadas externas, em milissegundos.

Fora do modo demonstracao, `N8N_API_URL` ou `NEXT_PUBLIC_N8N_API_URL` precisa estar configurada. A aplicacao nao troca silenciosamente para mock quando o backend real esta ausente.

### Autenticacao

- `AUTH_ENABLED`: forca ativacao/desativacao da autenticacao quando definido como `true` ou `false`.
- `AUTH_APP_BASE_URL`: origem canonica da aplicacao, sem caminho e sem barra final.
- `AUTH_URL` ou `NEXT_PUBLIC_APP_URL`: fallbacks para `AUTH_APP_BASE_URL`.
- `AUTH_IDENTIDADE_AUTHORIZE_URL`: endpoint de autorizacao do Identidade.
- `AUTH_IDENTIDADE_TOKEN_URL`: endpoint de token do Identidade.
- `AUTH_IDENTIDADE_LOGOUT_URL`: endpoint de logout do Identidade.
- `AUTH_IDENTIDADE_CLIENT_ID`: client id.
- `AUTH_IDENTIDADE_CLIENT_SECRET`: client secret server-side.
- `AUTH_IDENTIDADE_SCOPE`: escopos solicitados; padrao `dash.beneficio`.
- `AUTH_IDENTIDADE_REDIRECT_URI`: deve ser exatamente `{AUTH_APP_BASE_URL}/api/auth/callback`.
- `AUTH_IDENTIDADE_PKCE_ENABLED`: `true` por padrao.
- `AUTH_IDENTIDADE_FORCE_LOGIN`: quando `true`, envia `prompt=login` e `max_age=0`.
- `AUTH_COOKIE_SECURE`: em producao e sempre `true`; em desenvolvimento pode ser `false`.
- `AUTH_COOKIE_DOMAIN`: opcional; deixe vazio para cookies host-only.

Exemplo local em modo demonstracao:

```env
NEXT_PUBLIC_PORTAL_TITLE=Portal de Aprovacao de Pagamentos
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_APP_URL=http://localhost:3000
API_REQUEST_TIMEOUT_MS=30000
AUTH_ENABLED=false
```

Exemplo integrado:

```env
NEXT_PUBLIC_PORTAL_TITLE=Portal de Aprovacao de Pagamentos
NEXT_PUBLIC_APP_ENV=homologacao
NEXT_PUBLIC_DEMO_MODE=false
N8N_API_URL=https://capn8nwfhmg.azurewebsites.net/webhook/api/router
API_AUTH_TOKEN=
API_REQUEST_TIMEOUT_MS=30000
AUTH_ENABLED=true
AUTH_APP_BASE_URL=https://pagamentos.empresa.com.br
AUTH_IDENTIDADE_AUTHORIZE_URL=https://identidade.empresa.com.br/connect/authorize
AUTH_IDENTIDADE_TOKEN_URL=https://identidade.empresa.com.br/connect/token
AUTH_IDENTIDADE_LOGOUT_URL=https://identidade.empresa.com.br/connect/endsession
AUTH_IDENTIDADE_CLIENT_ID=
AUTH_IDENTIDADE_CLIENT_SECRET=
AUTH_IDENTIDADE_SCOPE=openid dash.beneficio
AUTH_IDENTIDADE_REDIRECT_URI=https://pagamentos.empresa.com.br/api/auth/callback
AUTH_IDENTIDADE_PKCE_ENABLED=true
AUTH_IDENTIDADE_FORCE_LOGIN=false
```

## Deploy

O projeto esta pronto para Vercel como uma aplicacao Next.js App Router. Configure o framework como `Next.js`, cadastre as variaveis de ambiente do ambiente alvo e garanta que a URL canonica usada no Identidade seja a mesma definida em `AUTH_APP_BASE_URL`.

Evite alternar entre dominio customizado, dominio `*.vercel.app` e URLs de preview durante o mesmo fluxo de login. Os cookies de sessao e os cookies temporarios de `state`, `nonce`, `code_verifier` e `returnTo` sao host-based quando `AUTH_COOKIE_DOMAIN` nao e definido.

## Observacoes de desenvolvimento

- `next.config.ts` usa `reactStrictMode` e `typedRoutes`.
- As paginas principais carregam dados no servidor e os componentes client fazem chamadas para Route Handlers internos em `/api/...`.
- Os dados demo ficam separados por dominio: aprovacoes, historico/visao mensal e tesouraria.
- Os normalizadores nos Route Handlers e services toleram formatos alternativos de datas e nomes de campos vindos do backend.
