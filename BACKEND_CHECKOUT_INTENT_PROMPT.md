# Prompt: Implementar Regra de Negocio no Backend (Checkout por Intent)

Voce e um engenheiro backend senior. Implemente no backend a regra de negocio de planos para checkout por intent, de forma segura e pronta para producao.

## Contexto
Tenho um frontend React/Vite que ja consome:
- `GET /api/v1/checkout/products`
- `POST /api/v1/checkout/intents`
- `POST /api/v1/checkout/intents/{intentId}/confirm`

O frontend **nao calcula preco** e usa apenas dados retornados pelo backend.
Agora preciso implementar isso no backend com multi-tenant, seguranca e consistencia transacional.

## Objetivo
Permitir que o backend:
1. Liste planos/produtos disponiveis para venda.
2. Crie intents de checkout com preco congelado no momento da criacao.
3. Confirme intents com validacoes de expiracao/status.
4. Garanta que o preco final nunca venha do frontend.

## Requisitos funcionais

### 1) Catalogo de planos
Criar endpoint:

`GET /api/v1/checkout/products`

Resposta:
```json
[
  {
    "id": "pro-monthly",
    "name": "Plano Pro Mensal",
    "description": "Gestao completa para saloes",
    "currency": "BRL",
    "price": 199.90,
    "highlight": "Mais vendido",
    "features": ["Agenda", "Clientes", "Financeiro"]
  }
]
```

Regras:
- Pode retornar planos globais ou por tenant (se aplicavel).
- Apenas planos ativos/publicaveis.
- Ordenar por prioridade/comercial.

### 2) Criar intent
Criar endpoint:

`POST /api/v1/checkout/intents`

Request:
```json
{
  "productId": "pro-monthly",
  "quantity": 1
}
```

Response:
```json
{
  "intentId": "uuid",
  "productId": "pro-monthly",
  "productName": "Plano Pro Mensal",
  "quantity": 1,
  "currency": "BRL",
  "unitPrice": 199.90,
  "totalPrice": 199.90,
  "status": "PENDING",
  "expiresAt": "2026-02-16T13:00:00Z"
}
```

Regras obrigatorias:
- Buscar produto no backend por `productId`.
- Validar `quantity` (minimo 1, maximo razoavel).
- **Congelar preco** (`unitPrice`, `totalPrice`) na intent.
- Definir `expiresAt` (ex.: 15 min).
- Persistir `tenantId`, `userId` (quando autenticado), `status=PENDING`.
- Nunca aceitar valor/preco no payload.

### 3) Confirmar intent
Criar endpoint:

`POST /api/v1/checkout/intents/{intentId}/confirm`

Response:
```json
{
  "intentId": "uuid",
  "status": "CONFIRMED",
  "redirectUrl": null
}
```

Regras:
- Buscar intent por `intentId`.
- Validar ownership/tenant.
- Se expirada: marcar `EXPIRED` e retornar status apropriado.
- So confirmar intents `PENDING`.
- Confirmar de forma idempotente (retries nao duplicam cobranca).
- Executar integracao de pagamento (ou stub interno) com tratamento transacional.
- Em sucesso: `CONFIRMED`.
- Em falha: `FAILED` (com motivo interno logado).

### 4) Estados suportados
- `PENDING`
- `CONFIRMED`
- `EXPIRED`
- `CANCELLED`
- `FAILED`

## Requisitos de seguranca
- Nao confiar em preco do cliente.
- Validar tenant em todas as operacoes.
- Validar autenticacao/autorizacao conforme politica.
- Sanitizar payload.
- Rate-limit em criacao de intents (recomendado).
- Logs auditaveis (intent criada, confirmada, expirada, falha).

## Requisitos tecnicos
- Codigo limpo e organizado por camadas (controller/service/repository/domain).
- DTOs de request/response explicitos.
- Migracao de banco para tabelas necessarias.
- Indices para consulta por `intentId`, `tenantId`, `status`, `expiresAt`.
- Job/rotina para expirar intents pendentes (ou expiracao lazy no confirm/get).

## Persistencia (minimo esperado)
Tabela `checkout_products`:
- id (pk string)
- name
- description
- currency
- price
- highlight
- features (json/text)
- is_active
- priority
- created_at
- updated_at

Tabela `checkout_intents`:
- id (uuid)
- tenant_id
- user_id (nullable)
- product_id
- product_name_snapshot
- currency_snapshot
- unit_price_snapshot
- quantity
- total_price_snapshot
- status
- expires_at
- payment_reference (nullable)
- failure_reason (nullable)
- created_at
- updated_at
- confirmed_at (nullable)

## Qualidade
- Testes unitarios:
  - calculo de total
  - regras de expiracao
  - idempotencia de confirmacao
  - validacao de status permitido
- Testes de integracao:
  - criar intent
  - confirmar sucesso
  - confirmar intent expirada
  - confirmar intent ja confirmada
- Padronizar erros HTTP:
  - 400 validacao
  - 404 intent/produto nao encontrado
  - 409 conflito de status
  - 422 regra de negocio
  - 500 erro interno

## Entrega esperada
- Endpoints implementados
- Entidades + migrations
- Services com regras de negocio
- Repositorios
- DTOs
- Testes automatizados
- Exemplos de requests/responses
- Sem pseudocodigo
- Pronto para producao
