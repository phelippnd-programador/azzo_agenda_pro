# Smoke Test - Estoque Fase 3

Projeto: Azzo Agenda Pro  
Data base: 2026-02-28  
Escopo: inventarios, fornecedores, pedidos de compra, transferencias e configuracoes

## 1. Inventarios
- Acessar `/estoque/inventarios`.
- Criar inventario em `/estoque/inventarios/novo`.
- Abrir detalhe `/estoque/inventarios/:id`.
- Registrar contagem para um item.
- Fechar inventario.
- Resultado esperado:
  - status evolui `ABERTO -> EM_CONTAGEM -> FECHADO`
  - mensagens de sucesso exibidas
  - pagina sem erro de runtime

## 2. Fornecedores
- Acessar `/estoque/fornecedores`.
- Criar novo fornecedor.
- Editar fornecedor existente.
- Buscar por nome/documento/email.
- Resultado esperado:
  - dados persistidos na lista
  - filtro textual funcionando
  - paginacao navegavel

## 3. Pedidos de compra
- Acessar `/estoque/pedidos-compra`.
- Criar pedido escolhendo fornecedor.
- Abrir detalhe `/estoque/pedidos-compra/:id`.
- Registrar recebimento parcial.
- Registrar recebimento final.
- Resultado esperado:
  - status evolui para `PARCIALMENTE_RECEBIDO` e depois `RECEBIDO`
  - quantidade pendente reduz corretamente
  - paginacao da lista funcionando

## 4. Transferencias
- Acessar `/estoque/transferencias`.
- Criar transferencia.
- Acionar `Enviar`.
- Acionar `Receber`.
- Resultado esperado:
  - status evolui `RASCUNHO -> ENVIADA -> RECEBIDA`
  - botoes habilitam/desabilitam conforme status
  - paginacao da lista funcionando

## 5. Configuracoes
- Acessar `/estoque/configuracoes`.
- Alterar flags e `diasCoberturaMeta`.
- Salvar configuracoes.
- Resultado esperado:
  - validacao de `diasCoberturaMeta > 0`
  - mensagem de sucesso ao salvar

## 6. Regressao rapida
- Navegar entre todas as abas do modulo estoque.
- Validar que nao ocorre redirecionamento indevido.
- Validar que os endpoints chamados pertencem ao contexto de estoque.
- Rodar build:
  - `npm run build`
  - esperado: build concluido com sucesso.
