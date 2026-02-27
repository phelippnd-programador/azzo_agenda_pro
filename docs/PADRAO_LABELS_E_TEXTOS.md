# Padrao de Labels e Textos (UI)

Objetivo: padronizar terminologia, reduzir ambiguidade e evitar variacoes de escrita.

## 1. Convencoes Gerais
- Usar termos consistentes entre menu, cards e telas.
- Evitar abreviacoes em labels de menu (ex.: usar `Configuracao de Impostos` em vez de `Config. Impostos`).
- Preferir linguagem direta e operacional.
- Manter estilo unico por modulo:
  - acao: verbo no infinitivo (ex.: `Emitir Nota Fiscal`).
  - estado: substantivo/qualificador (ex.: `Ativo`, `Inativo`).

## 2. Glossario Padrao
- Servico / Servicos
- Profissional / Profissionais
- Agendamento / Agendamentos
- Concluido / Concluidos
- Cancelado / Cancelados
- Comissao
- Faturamento
- Clientes atendidos
- Licenca
- Configuracao de Impostos
- Pre-visualizacao de NF

## 3. Regras para Titulos e Subtitulos
- Titulo de tela: 2 a 4 palavras, semanticamente claro.
- Subtitulo: explicar objetivo da tela em 1 frase curta.
- Evitar duplicidade entre titulo e card principal.

## 4. Mensagens de Erro e Sucesso
- Erro: descrever acao e proximo passo.
  - Ex.: `Erro ao carregar profissionais. Tente novamente.`
- Sucesso: confirmar acao concluida.
  - Ex.: `Servico atualizado com sucesso.`

## 5. Checklist de Revisao de Texto
- [x] Existe consistencia entre menu e titulo da tela.
- [x] Nao ha abreviacao indevida em labels principais.
- [x] Estados e status usam vocabulario uniforme.
- [x] Mensagens de erro indicam acao corretiva.
- [x] Mensagens de sucesso confirmam acao executada.

Status da revisao:
- Revisao de labels do frontend principal concluida em 2026-02-27.
- Pendencias residuais de homologacao ficam no pacote de evidencias por RF.

## 6. Observacao sobre Encoding
- Salvar arquivos em UTF-8.
- Em caso de caracteres invalidos na exibicao, revisar encoding do arquivo e do terminal.
- Se necessario, priorizar texto ASCII para evitar regressao de renderizacao.
