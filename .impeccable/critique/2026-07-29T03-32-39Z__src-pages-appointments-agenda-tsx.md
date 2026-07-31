---
target: /agenda (src/pages/appointments/Agenda.tsx)
total_score: 25
max_score: 40
na_heuristics:
p0_count: 2
p1_count: 2
timestamp: 2026-07-29T03-32-39Z
slug: src-pages-appointments-agenda-tsx
---
Method: dual-agent (A: a7671673d9a05d42e · B: ab78f08c71a02c7eb)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | No current-time marker or scroll-to-now in the day grid; owner hunts for "where are we" at 15h. |
| 2 | Match System / Real World | 3 | System-vocabulary leaks ("rastro operacional", "Media por dia ativo") into what should be salon language. |
| 3 | User Control and Freedom | 2 | Cancelling fires instantly with zero confirmation and no undo; `allowedTransitions.CANCELLED = []` closes the door forever. |
| 4 | Consistency and Standards | 2 | Same appointment exposes three different action sets across list/column/week modes; week view has none at all. |
| 5 | Error Prevention | 2 | Mandatory care-note gate before concluding is enforced in the details sheet but bypassable from the grid dropdown. |
| 6 | Recognition Rather Than Recall | 3 | Column mode assigns 8 rotating professional colours with no legend; index-based, reshuffles on deactivation. |
| 7 | Flexibility and Efficiency | 2 | No keyboard shortcuts, no drag-to-reschedule, filters/viewMode don't persist, week "+Novo" hardcodes 09:00. |
| 8 | Aesthetic and Minimalist Design | 1 | Header stacks instructional paragraphs + 3 hint cards + 4 KPI tiles + toolbar + Alert before the grid renders; first row can be below the fold. |
| 9 | Error Recovery | 3 | Conflict dialog is excellent, but a week-fetch failure silently blanks the week and empty states don't distinguish "no data" from "filtered out". |
| 10 | Help and Documentation | 4 | Six-module Joyride tour, genuinely above average — if anything over-served vs. the inline hints. |
| **Total** | | **25/40** | **Acceptable** |

## Design Specificity Verdict

**LLM assessment:** Could ship unchanged as any scheduling SaaS, with two salon-shaped exceptions bolted on inside modals. The surface opens by teaching the user how to read an agenda ("Leia a agenda em duas etapas...") — design-system voice, not salon voice. Nothing in the chrome signals "salon": no "próximo cliente", no "quem está na cadeira agora", no revenue-of-the-day, no walk-in path, no now-line. The two places that *are* authored for this product — the conclusion dialog's comanda-vs-pagar-agora fork, and the conflict-resolution flow — are genuinely excellent, but both live one click deep inside modals. The screen the owner stares at all day carries none of that authorship. Column mode (one chair per column, card height = duration) is the one layout decision that could not be lifted from a generic SaaS — it's the strongest specificity signal on the page.

**Deterministic scan:** `detect.mjs` on `src/components/appointments/` returned 18 findings, all one rule (`design-system-font-size`): text sized 8–10px across `AgendaDayView.tsx`, `AgendaWeekView.tsx`, `AgendaMonthView.tsx`, below DESIGN.md's documented 12px floor. No false positives — every hit is genuinely under the floor. `Agenda.tsx` itself scanned clean.

**Visual overlays:** Not attempted. `/agenda` is an authenticated route requiring a live backend (`VITE_API_URL` injected at container start); starting a dev server and logging in was out of scope for this run per the browser-evidence skip rule. No overlay exists; static code review and the CLI detector are the only evidence.

## Overall Impression

Two genuinely excellent domain-aware flows (conflict resolution, comanda-vs-pagar-agora) are buried inside modals, while the surface the owner spends her whole day on is generic scheduling-SaaS chrome that lectures her every morning and hides the one number she opens the screen to check: money. The biggest opportunity is inversion — promote what's already correct in the modals to the surface, and cut the instructional chrome that's fighting it for space.

## What's Working

1. **Conflict resolution is real product thinking.** Splits slots into "vagos" vs. a red-bordered "com conflito" block with counts, intercepts before the request round-trip, and varies its message by whether manual conflict is enabled for the tenant — honours the confirmed overlap constraint while acknowledging real salons sometimes double-book on purpose.
2. **The create flow can't assemble an impossible appointment.** Walks the user back to the earliest invalid step when an upstream selection breaks, clears a service that stops matching the professional, clears time when date/professional/service change, filters bidirectionally. Rare discipline.
3. **Column mode is the correct native model for a multi-chair salon.** One column per professional, card height proportional to duration, click-an-empty-slot books pre-filled with time and professional. The one layout choice that is unmistakably this product's.

## Priority Issues

**[P0] Cancelling an appointment is instant, silent, and irreversible**
Why it matters: fires from a dropdown item with zero confirmation while the owner is one-handed at the balcão with a client watching; sits directly above "Excluir" in a 6-item menu, both red; `allowedTransitions.CANCELLED = []` means no path back, no undo, no signal about whether the client was notified. A one-row mis-aim destroys a real booking.
Fix: route cancel through the same confirmation pattern already used for no-show, naming client/date/time/service and whether WhatsApp fires; separate destructive items with a menu divider; move "Excluir" out of the card menu into the details sheet.
Suggested command: `/impeccable harden`

**[P0] The mandatory care-note gate is enforced in one path and bypassable in the other**
Why it matters: the details sheet disables "Concluir atendimento" until a care note exists and calls it mandatory; the grid dropdowns offer the same action with no such check. Concluding creates receita, comissão and baixa de estoque — either the rule is real and the fastest path silently violates it, or the sheet is lying and blocking at the busiest moment. Either reading damages trust, and the owner will learn to route around the sheet.
Fix: move the gate into the single `handleStatusChange` entry point so every path hits it; on missing notes, open the sheet scrolled to the notes block instead of disabling an unreachable button.
Suggested command: `/impeccable harden`

**[P1] The conclusion dialog hides the money it's about to create**
Why it matters: "O que fazer com o valor deste atendimento?" — with no value, client, service, or professional shown. The owner concludes ten to fifteen of these back-to-back at day's end from a dropdown; without the amount she can't catch a wrong price before it becomes revenue and commission. This is the exact hole in PRODUCT.md's "money cycle can't have holes" principle.
Fix: hold the full appointment object in state (not just the id) and head the dialog with client name, service, professional, and the formatted total at headline size.
Suggested command: `/impeccable clarify`

**[P1] The agenda starts below the fold, behind instructions**
Why it matters: two paragraphs teaching "how to read this screen", three hint panels, four KPI tiles, a wrapping toolbar, and an Alert all render before the grid — every single time the owner opens the screen, dozens of times a day, with no receptionist and little time per task. Only the hint cards are dismissible; the instructional paragraphs and KPI tiles are permanent.
Fix: delete the instructional paragraphs (the Joyride tour already owns that content); collapse the four KPI tiles into one inline pill row beside the date.
Suggested command: `/impeccable distill`

**[P2] No current-time marker in the day grid, and colour used as the only status/action signal in places**
Why it matters: every competing calendar the owner has touched marks "now"; without it she re-reads timestamps every glance. Separately, 8 rotating professional colours have no legend and reshuffle when someone is deactivated, and column-mode status is colour-only with no text label — a real accessibility and recognition cost stacked on top of the missing time marker.
Fix: add a positioned now-line with a small time pill in the day grid (column mode already computes the geometry needed); add a status label/badge to column-mode cards; add a professional-colour legend or switch to avatar-based identification.
Suggested command: `/impeccable clarify`

## Persona Red Flags

**Alex (Power User):** Zero keyboard shortcuts (no shortcut for "today", no arrow-key day nav). No drag-to-reschedule — moving a 14h slot to 15h takes five interactions through a full edit dialog. Week view is read-only: a third of the view toggle leads to a surface where nothing can be done. Week "+Novo" always books 09:00 regardless of which slot was clicked. Filters and view mode reset on every reload.

**Sam (Accessibility):** The empty-slot "create" button in the day grid is `opacity-0` with hover-only reveal and **no focus-visible equivalent** — a keyboard user tabbing through the grid crosses one fully invisible focusable control per empty half-hour slot, potentially 20+ silent stops. Column-mode slots are plain `<div onClick>` with no `role`/`tabIndex`/key handler — the fastest booking path in the product doesn't exist for keyboard or screen-reader users. Several icon-only buttons (eye/kebab) carry no `aria-label`, inconsistent with the date-nav arrows which do. Text as small as 8–9px appears on status badges and secondary labels.

**Márcia — the owner who does everything (derived from PRODUCT.md):** The fastest booking path (click an empty slot) opens straight into a client-database search with no "cliente avulso" option — a walk-in, the most common case in a small salon, is the slowest path in the product. End of day is a modal gauntlet: twelve atendimentos to conclude, each kebab → dialog → possibly NFS-e → possibly cash-closing guard, no bulk action, no amount shown at any step. None of the four KPI tiles shows today's revenue even though `totalPrice` is on every appointment object.

## Minor Observations

- Week-view KPI tile shows a *monthly* total under a badge labelled "na semana" — two contradictory numbers on one card.
- "Pendentes" tile merges `PENDING` and `CONFIRMED` counts, but the status filter treats them as separate options — the tile number can't be reconciled with the filter.
- Loading skeleton shape doesn't resemble the actual layout, so the page visibly jumps on first load.
- Two different steps in the new-appointment flow are both labelled "Etapa 5" while the step rail disagrees.
- pt-BR accenting is inconsistent within single files/lines (e.g. "Volume, pendencias e execução" mixes both conventions in one string) — a cheap, visible credibility loss for a Brazilian-Portuguese product.
- Several primary/destructive buttons bypass the design token entirely with hardcoded `bg-blue-600` / `bg-red-600` / `bg-green-600` instead of `primary`/`destructive`.
- The four KPI tiles and the 8-colour professional palette hand-roll amber/sky/emerald tones inline — functionally the same pattern DESIGN.md's Do's-and-Don'ts already names as legacy to avoid on new work.
- Icon-only nav buttons request `variant="outline" size="icon"`, but the Button component forces `size="icon"` to always render as `ghost` — the outline request is silently discarded, so the two most-used controls on the screen (prev/next day) render borderless.

## Questions to Consider

- If the owner has no receptionist and books walk-ins constantly, why is step one of every booking a client-database search with no escape hatch?
- Four KPI tiles count appointments; zero show money. The product's own principle says the money cycle can't have a hole — why is revenue absent from the screen the day happens on?
- Cancelling gets no confirmation; deleting gets one. Which of those two actually costs the salon a client?
- The screen teaches the user how to read it in prose *and* in a six-module guided tour. If you could keep only one, which would you delete?
