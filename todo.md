# Módulo de Apuração Mensal de Impostos - Frontend

## Resumo
Implementar o módulo de apuração mensal de impostos no frontend do Azzo Agenda Pro, seguindo o design técnico em `/workspace/app/docs/design/apuracao-mensal-impostos.md`.

## Arquivos a Criar

### 1. Tipos TypeScript
- `src/types/apuracao.ts` - Tipos para ApuracaoMensal, ApuracaoImposto, StatusApuracao, TipoImposto

### 2. Funções de Cálculo e Storage
- `src/lib/apuracao-storage.ts` - Gerenciamento de localStorage para apurações
- `src/lib/apuracao-calculator.ts` - Lógica de cálculo de apuração baseada nas notas fiscais

### 3. Componentes
- `src/components/fiscal/ApuracaoCard.tsx` - Card de resumo da apuração mensal
- `src/components/fiscal/ApuracaoImpostoList.tsx` - Lista de impostos discriminados

### 4. Página Principal
- `src/pages/ApuracaoMensal.tsx` - Página principal de apuração mensal

### 5. Atualização de Rotas
- Atualizar `src/App.tsx` para incluir a rota `/apuracao-mensal`

## Funcionalidades
1. Visualização do mês corrente com total a pagar
2. Discriminação por tipo de imposto (ICMS, PIS, COFINS, ISS, DAS)
3. Status parcial/fechado baseado na data
4. Histórico de meses anteriores
5. Atualização dinâmica conforme notas emitidas
6. Recálculo manual sob demanda
7. Suporte a Simples Nacional e Lucro Presumido