# Auditoria UI Frontend (Design System)

Data: 2026-02-27
Escopo: aplicacao frontend (`src/`), foco em base visual e padronizacao de texto.

## 1. Design System (cores, espacos, radius, sombras)
- Tokens globais definidos em [index.css](C:/Users/phelipp/Projetos/azzo-agenda/frontend/src/index.css):
  - `--background`, `--foreground`, `--primary`, `--secondary`, `--muted`, `--destructive`;
  - tokens de borda/input/ring e sidebar;
  - `--radius` unico para bordas.
- Mapeamento de tokens no Tailwind em [tailwind.config.ts](C:/Users/phelipp/Projetos/azzo-agenda/frontend/tailwind.config.ts).
- Componentes base (`card`, `button`, `badge`, `dialog`) usam tokens semanticos na maior parte das telas principais.

Status: atendido.

## 2. Escala tipografica
- Escala padrao centralizada em [tailwind.config.ts](C:/Users/phelipp/Projetos/azzo-agenda/frontend/tailwind.config.ts):
  - `xs`, `sm`, `base`, `lg`, `xl`, `2xl`, `3xl` com line-height e peso.
- Fonte base definida em `fontFamily.sans` com Inter.
- Uso consistente em telas principais por classes utilitarias (`text-sm`, `text-base`, `text-lg`, etc.).

Status: atendido.

## 3. Estados loading/empty/error
- Loader global: [full-screen-loader.tsx](C:/Users/phelipp/Projetos/azzo-agenda/frontend/src/components/ui/full-screen-loader.tsx).
- Estados padronizados de pagina:
  - [page-states.tsx](C:/Users/phelipp/Projetos/azzo-agenda/frontend/src/components/ui/page-states.tsx)
  - `PageErrorState` e `PageEmptyState`.
- Cobertura encontrada nas telas principais: Dashboard, Agenda, Servicos, Profissionais, Clientes, Financeiro, Financeiro por profissional, fluxo publico (loading com skeleton).

Status: atendido.

## 4. Labels e textos
- Documento-base de nomenclatura: `docs/PADRAO_LABELS_E_TEXTOS.md`.
- Ajustes realizados nas telas principais para termos consistentes de menu/modulo.
- Observacao: ainda existem textos pontuais com historico de encoding em arquivos legados; sem impacto funcional.

Status: atendido.
