# Azzo Agenda Frontend - API Contracts

Base URL atual no frontend: `http://localhost:8080/api/v1`

## 1) Padroes Globais

- `Content-Type`: `application/json`
- Autenticacao: `Authorization: Bearer <token>` em todas as rotas privadas
- Excecoes sem token: `POST /auth/login` e `POST /auth/register`
- Datas:
  - `date`: `YYYY-MM-DD`
  - `datetime`: ISO 8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`)
- Resposta esperada pelo frontend:
  - sucesso: JSON puro (objeto/array, sem envelope obrigatorio)
  - erro: texto simples ou JSON parseavel (frontend hoje le `response.text()`)
- `204 No Content` e suportado pelo client para `DELETE`

## 2) Modelos de Dados (referencia)

### User
```json
{
  "id": "string",
  "tenantId": "string",
  "name": "string",
  "email": "string",
  "phone": "string",
  "role": "OWNER|PROFESSIONAL|CLIENT",
  "avatar": "string|null",
  "salonName": "string|null",
  "createdAt": "datetime"
}
```

### Service
```json
{
  "id": "string",
  "tenantId": "string",
  "name": "string",
  "description": "string",
  "duration": 60,
  "price": 120.5,
  "category": "string",
  "professionalIds": ["string"],
  "isActive": true,
  "createdAt": "datetime"
}
```

### Professional
```json
{
  "id": "string",
  "tenantId": "string",
  "userId": "string",
  "name": "string",
  "email": "string",
  "phone": "string",
  "avatar": "string|null",
  "specialties": ["string"],
  "commissionRate": 40,
  "workingHours": [
    {
      "dayOfWeek": 1,
      "startTime": "09:00",
      "endTime": "18:00",
      "isWorking": true
    }
  ],
  "isActive": true,
  "createdAt": "datetime"
}
```

### Client
```json
{
  "id": "string",
  "tenantId": "string",
  "name": "string",
  "email": "string",
  "phone": "string",
  "birthDate": "date|null",
  "notes": "string|null",
  "totalVisits": 0,
  "totalSpent": 0,
  "lastVisit": "date|null",
  "createdAt": "datetime"
}
```

### Appointment
```json
{
  "id": "string",
  "tenantId": "string",
  "clientId": "string",
  "professionalId": "string",
  "serviceId": "string",
  "date": "date",
  "startTime": "09:00",
  "endTime": "10:00",
  "status": "PENDING|CONFIRMED|IN_PROGRESS|COMPLETED|CANCELLED|NO_SHOW",
  "notes": "string|null",
  "totalPrice": 0,
  "createdAt": "datetime"
}
```

### Transaction
```json
{
  "id": "string",
  "tenantId": "string",
  "appointmentId": "string|null",
  "type": "INCOME|EXPENSE",
  "category": "string",
  "description": "string",
  "amount": 0,
  "paymentMethod": "CASH|CREDIT_CARD|DEBIT_CARD|PIX|OTHER",
  "date": "date",
  "createdAt": "datetime"
}
```

### DashboardMetrics
```json
{
  "todayAppointments": 0,
  "todayRevenue": 0,
  "monthlyRevenue": 0,
  "totalClients": 0,
  "pendingAppointments": 0,
  "completedToday": 0
}
```

## 3) Contratos - Rotas Ja Existentes (consumidas hoje)

## Auth

### `POST /auth/login`
- Auth: publica
- Request:
```json
{
  "email": "string",
  "password": "string"
}
```
- Response `200`:
```json
{
  "access_token": "string",
  "token": "string",
  "user": {}
}
```
- Observacao: frontend aceita `access_token` ou `token`.

### `POST /auth/register`
- Auth: publica
- Request:
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "salonName": "string",
  "phone": "string"
}
```
- Response `201|200`: mesmo formato de login

### `GET /auth/me` (recomendado para corrigir sessao fake)
- Auth: privada
- Response `200`: `User`

## Dashboard

### `GET /dashboard/metrics`
- Auth: privada
- Response `200`: `DashboardMetrics`

## Services

### `GET /services`
- Auth: privada
- Response `200`: `Service[]`

### `POST /services`
- Auth: privada
- Request:
```json
{
  "name": "string",
  "description": "string",
  "duration": 60,
  "price": 0,
  "category": "string",
  "professionalIds": ["string"],
  "isActive": true
}
```
- Response `201`: `Service`

### `PUT /services/:id`
- Auth: privada
- Request: parcial de `Service`
- Response `200`: `Service`

### `DELETE /services/:id`
- Auth: privada
- Response `204`

## Professionals

### `GET /professionals`
- Auth: privada
- Response `200`: `Professional[]`

### `POST /professionals`
- Auth: privada
- Request:
```json
{
  "userId": "string",
  "name": "string",
  "email": "string",
  "phone": "string",
  "avatar": "string|null",
  "specialties": ["string"],
  "commissionRate": 0,
  "workingHours": [],
  "isActive": true
}
```
- Response `201`: `Professional`

### `PUT /professionals/:id`
- Auth: privada
- Request: parcial de `Professional`
- Response `200`: `Professional`

### `DELETE /professionals/:id`
- Auth: privada
- Response `204`

## Clients

### `GET /clients`
- Auth: privada
- Response `200`: `Client[]`

### `POST /clients`
- Auth: privada
- Request:
```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "birthDate": "date|null",
  "notes": "string|null"
}
```
- Response `201`: `Client`

### `PUT /clients/:id`
- Auth: privada
- Request: parcial de `Client`
- Response `200`: `Client`

### `DELETE /clients/:id`
- Auth: privada
- Response `204`

## Appointments

### `GET /appointments`
- Auth: privada
- Response `200`: `Appointment[]`

### `POST /appointments`
- Auth: privada
- Request:
```json
{
  "clientId": "string",
  "professionalId": "string",
  "serviceId": "string",
  "date": "date",
  "startTime": "09:00",
  "endTime": "10:00",
  "status": "PENDING",
  "totalPrice": 0,
  "notes": "string|null"
}
```
- Response `201`: `Appointment`

### `PATCH /appointments/:id/status?value={STATUS}`
- Auth: privada
- Query: `value=PENDING|CONFIRMED|IN_PROGRESS|COMPLETED|CANCELLED|NO_SHOW`
- Response `200`: `Appointment`

### `DELETE /appointments/:id`
- Auth: privada
- Response `204`

## Finance

### `GET /finance/transactions`
- Auth: privada
- Response `200`: `Transaction[]`

### `GET /finance/transactions/summary`
- Auth: privada
- Response `200`:
```json
{
  "totalIncome": 0,
  "totalExpenses": 0,
  "balance": 0
}
```

### `POST /finance/transactions`
- Auth: privada
- Request:
```json
{
  "appointmentId": "string|null",
  "type": "INCOME|EXPENSE",
  "category": "string",
  "description": "string",
  "amount": 0,
  "paymentMethod": "CASH|CREDIT_CARD|DEBIT_CARD|PIX|OTHER",
  "date": "date"
}
```
- Response `201`: `Transaction`

### `DELETE /finance/transactions/:id`
- Auth: privada
- Response `204`

## Reports

### `GET /reports/daily?date=YYYY-MM-DD`
- Auth: privada
- Response `200` (proposto):
```json
{
  "date": "date",
  "appointmentsCount": 0,
  "completedCount": 0,
  "cancelledCount": 0,
  "revenue": 0,
  "topServices": [
    { "serviceId": "string", "name": "string", "count": 0, "revenue": 0 }
  ]
}
```

### `GET /reports/commissions?from=YYYY-MM-DD&to=YYYY-MM-DD&professionalUserId={id}`
- Auth: privada
- Response `200` (proposto):
```json
{
  "professionalUserId": "string",
  "from": "date",
  "to": "date",
  "totalRevenue": 0,
  "commissionRate": 0,
  "commissionValue": 0,
  "items": [
    {
      "appointmentId": "string",
      "date": "date",
      "serviceName": "string",
      "amount": 0,
      "commissionValue": 0
    }
  ]
}
```

## 4) Contratos - Rotas que Precisam Existir (hoje mock/localStorage)

## Salon Profile

### `GET /salon/profile`
- Auth: privada
- Response `200`:
```json
{
  "salonName": "string",
  "salonSlug": "string",
  "salonDescription": "string|null",
  "salonPhone": "string|null",
  "salonWhatsapp": "string|null",
  "salonEmail": "string|null",
  "salonWebsite": "string|null",
  "salonInstagram": "string|null",
  "salonFacebook": "string|null",
  "street": "string|null",
  "number": "string|null",
  "complement": "string|null",
  "neighborhood": "string|null",
  "city": "string|null",
  "state": "string|null",
  "zipCode": "string|null",
  "businessHours": [
    { "day": "Segunda-feira", "enabled": true, "open": "09:00", "close": "19:00" }
  ]
}
```

### `PUT /salon/profile`
- Auth: privada
- Request: mesmo contrato de `GET /salon/profile`
- Response `200`: perfil atualizado

### `GET /public/salons/:slug`
- Auth: publica
- Response `200`:
```json
{
  "salonName": "string",
  "salonSlug": "string",
  "salonDescription": "string|null",
  "salonPhone": "string|null",
  "salonWhatsapp": "string|null",
  "businessHours": [],
  "logo": "string|null"
}
```

## Public Booking

### `GET /public/salons/:slug/services`
- Auth: publica
- Response `200`: `Service[]` ativos

### `GET /public/salons/:slug/professionals`
- Auth: publica
- Response `200`: `Professional[]` ativos

### `GET /public/salons/:slug/availability?date=YYYY-MM-DD&serviceId={id}&professionalId={id}`
- Auth: publica
- Response `200`:
```json
{
  "date": "date",
  "slots": [
    { "time": "09:00", "available": true }
  ]
}
```

### `POST /public/salons/:slug/appointments`
- Auth: publica
- Request:
```json
{
  "customerName": "string",
  "customerPhone": "string",
  "customerEmail": "string|null",
  "professionalId": "string",
  "serviceId": "string",
  "date": "date",
  "startTime": "09:00"
}
```
- Response `201`:
```json
{
  "appointmentId": "string",
  "status": "PENDING|CONFIRMED",
  "message": "string"
}
```

## Settings

### `GET /settings`
- Auth: privada
- Response `200`:
```json
{
  "notifications": {
    "emailNotifications": true,
    "smsNotifications": true,
    "whatsappNotifications": true,
    "reminderHours": 24
  },
  "businessHours": {
    "monday": { "open": "09:00", "close": "19:00", "enabled": true },
    "tuesday": { "open": "09:00", "close": "19:00", "enabled": true },
    "wednesday": { "open": "09:00", "close": "19:00", "enabled": true },
    "thursday": { "open": "09:00", "close": "19:00", "enabled": true },
    "friday": { "open": "09:00", "close": "19:00", "enabled": true },
    "saturday": { "open": "09:00", "close": "17:00", "enabled": true },
    "sunday": { "open": "09:00", "close": "13:00", "enabled": false }
  }
}
```

### `PUT /settings/notifications`
- Auth: privada
- Request:
```json
{
  "emailNotifications": true,
  "smsNotifications": true,
  "whatsappNotifications": true,
  "reminderHours": 24
}
```
- Response `200`

### `PUT /settings/business-hours`
- Auth: privada
- Request: mesmo shape de `businessHours`
- Response `200`

### `PUT /users/me`
- Auth: privada
- Request:
```json
{
  "name": "string",
  "email": "string",
  "phone": "string|null"
}
```
- Response `200`: `User`

### `PUT /users/me/password`
- Auth: privada
- Request:
```json
{
  "currentPassword": "string",
  "newPassword": "string",
  "confirmPassword": "string"
}
```
- Response `204|200`

## Fiscal - Tax Config

### `GET /fiscal/tax-config`
- Auth: privada
- Response `200`:
```json
{
  "regime": "SIMPLES_NACIONAL|LUCRO_PRESUMIDO",
  "icmsRate": 2.75,
  "pisRate": 0.65,
  "cofinsRate": 3.0
}
```

### `PUT /fiscal/tax-config`
- Auth: privada
- Request: mesmo shape de `GET /fiscal/tax-config`
- Response `200`

## Fiscal - Invoices

### `GET /fiscal/invoices`
- Auth: privada
- Query opcional: `status`, `from`, `to`, `page`, `pageSize`
- Response `200`:
```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "pageSize": 20
}
```

### `GET /fiscal/invoices/:id`
- Auth: privada
- Response `200`: `Invoice`

### `POST /fiscal/invoices`
- Auth: privada
- Request:
```json
{
  "type": "NFE|NFCE",
  "customer": {
    "type": "CPF|CNPJ",
    "document": "string",
    "name": "string",
    "email": "string|null",
    "phone": "string|null"
  },
  "items": [
    {
      "id": "string",
      "description": "string",
      "quantity": 1,
      "unitPrice": 0,
      "totalPrice": 0,
      "cfop": "5.933",
      "cst": "00"
    }
  ],
  "operationNature": "string",
  "notes": "string|null",
  "appointmentId": "string|null",
  "status": "DRAFT|ISSUED"
}
```
- Response `201`: `Invoice`

### `PATCH /fiscal/invoices/:id/cancel`
- Auth: privada
- Request (opcional):
```json
{
  "reason": "string"
}
```
- Response `200`: `Invoice` com `status=CANCELLED`

### `POST /fiscal/invoices/:id/authorize` (opcional)
- Auth: privada
- Response `200`: `Invoice` com `accessKey` e `authorizationProtocol`

### `GET /fiscal/invoices/:id/pdf` (opcional)
- Auth: privada
- Response `200`: `application/pdf`

## Fiscal - Apuracao Mensal

### `GET /fiscal/apuracoes/current`
- Auth: privada
- Response `200`: `ApuracaoMensal`

### `GET /fiscal/apuracoes/:ano/:mes`
- Auth: privada
- Response `200`: `ApuracaoMensal`

### `POST /fiscal/apuracoes/:ano/:mes/recalculate`
- Auth: privada
- Response `200`: `ApuracaoMensal`

### `GET /fiscal/apuracoes/historico?limite=12`
- Auth: privada
- Response `200`: `ApuracaoResumo[]`

### `GET /fiscal/apuracoes/resumo-anual?ano=YYYY`
- Auth: privada
- Response `200`:
```json
{
  "totalServicos": 0,
  "totalImpostos": 0,
  "totalDocumentos": 0,
  "meses": []
}
```

## Dashboard Complementar

### `GET /dashboard/revenue/weekly?start=YYYY-MM-DD&end=YYYY-MM-DD`
- Auth: privada
- Response `200`:
```json
{
  "points": [
    { "day": "Seg", "date": "date", "value": 0 }
  ],
  "total": 0,
  "average": 0
}
```

## 5) Padrao de Erro Recomendado (para evolucao)

Mesmo que o frontend atual aceite texto, recomenda-se padronizar JSON:
```json
{
  "code": "VALIDATION_ERROR",
  "message": "Descricao do erro",
  "details": [
    { "field": "email", "message": "Email invalido" }
  ],
  "timestamp": "datetime",
  "path": "/api/v1/..."
}
```

Status sugeridos: `400`, `401`, `403`, `404`, `409`, `422`, `500`.
