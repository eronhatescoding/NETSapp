# DNA-Upgrade.md — NETS Insights (DNA) page rework (Round 3)

> Briefs **Claude Code** to bring the **DNA** (Insights) page onto the light design
> system already live in Calendar / Explore / Pay, restructure it into a profile-style
> identity page, and add a persona showcase + recommendation card.
>
> The global tokens, **DM Sans**, `.nets-card`, and the `tagLabel()` map already exist
> from earlier rounds — **adopt** them, don't redefine. This round is **presentation/
> layout only**: do **not** change the DNA computation, the affinity formula, Eron's
> Explore match logic, or any data/function code. If a UI change seems to need a data
> change, **stop and ask.**

---

## 0. READ FIRST — investigate, report, then pause

Do not edit yet. Read the DNA/Insights page (`.page.html/.scss/.ts`), the
`user-dna.service.ts` it consumes, the Wrapped component, and the Explore page's `.ts`.
**Answer five questions:**

1. **Layout map + data.** What the DNA page currently renders and from which fields:
   profile, persona chips, stats (spent/income/txns), category breakdown, top merchants,
   affinity vector, detected patterns.
2. **Category → merchants drill-down (gate).** Confirm the data lets you group **which
   merchants sit under each category, with per-merchant visit count + spend.** The service
   computes `topMerchants` + the affinity vector already; verify a category→merchants
   grouping is derivable. If it isn't cleanly derivable, **report it and propose the
   smallest read-only grouping** rather than changing the computation.
3. **Recommendation source (gate).** Find how Explore computes its **top DNA-matched
   item** and whether that #1 match (its name + reason line) is **retrievable from the DNA
   page** (shared service, or re-run the same selector read-only). The recommendation card
   (§5) must reuse Eron's existing match — **do not invent a new matching algorithm.**
   If it's not retrievable, report options and pause.
4. **Affinity tag leak.** Confirm the affinity list currently renders **raw tags**
   ("liveevents", "music", lowercase). It must run through the existing `tagLabel()` map
   (§7).
5. **Top Merchants metric.** Confirm `topMerchants` exposes **visit count** and **total
   spend** per merchant (needed for §8).

**Post: the layout/data map, the two gate verdicts (drill-down + recommendation), and a
build plan. Pause for approval.** Build only after sign-off.

---

## 1. Scope

**In scope (DNA page only):**
- Re-theme to the live tokens (it's mostly there; tighten consistency + fix the red CTA).
- **Two-column header**: avatar + name flushed **left**; **recommendation card** right.
- **Persona showcase**: "Know your persona!" + 3 persona **image-cards** → tap opens a
  popup (image · name · static description). Image slots left empty for Calvin to fill.
- **Wrapped** entry: keep the story-card concept, re-theme; **CTA → cyan gradient** (off
  red).
- **All-time stats card** + **category breakdown** (expandable, with **merchant
  drill-down** per category), both labelled **all-time**.
- **Top Merchants** as a **bar graph ranked by visits**, spend shown per bar.
- **Affinities** as a progress-bar list, **with friendly labels** via `tagLabel()`.
- **Remove Detected Patterns** from this page (it lives on Calendar).

**Out of scope / do NOT touch:**
- DNA computation, affinity formula, Eron's Explore match logic, the Wrapped's underlying
  data — presentation only.
- Calendar / Explore / Pay / Settings.

---

## 2. Design foundation (already live — adopt)

Reference the existing global tokens; add no new hex.

| Token | Hex | Role |
|---|---|---|
| `--app-bg` | `#FAFAFA` | page background |
| `--surface` | `#FFFFFF` | cards |
| `--surface-muted` | `#F5F5F5` | chips, inset rows, dividers |
| `--border-hairline` | `#ECECEC` | 1px definition |
| `--primary` | `#00A6CB` | brand/interactive: CTAs, links, active bars, recommendation card |
| `--primary-glow` | `#0DCAF0` | accent/gradient only — never as text |
| `--spent` | `#EA0029` | money out (NOT the Wrapped CTA) |
| `--income` | `#16B364` | money in |
| `--predicted` | `#F5A524` | planned/AI |
| `--text-primary` | `#0B1A2B` | titles, amounts |
| `--text-secondary` | `#6B7280` | labels, captions |

Font: **DM Sans** (global). Money/% use `font-variant-numeric: tabular-nums`.
Cards: shared **`.nets-card`**. Signature gradient (sparingly):
`linear-gradient(135deg, #00A6CB, #0DCAF0)`.

---

## 3. Page order (top → bottom) — rebuild to this

```
1  Header:  NETS · DNA                         ⚙ settings
2  ┌ avatar + name (LEFT) ──┬─ recommendation card (RIGHT) ─┐
   │  (C)  Calvin           │  ✨ For you                    │
   │  Your Consumer DNA     │  <top match name>             │
   │                        │  Because you love …      ›    │
   └────────────────────────┴───────────────────────────────┘
   ──────────────── cyan divider line ────────────────
3  Know your persona!
   Based on your spending habits:
   [ persona 1 ] [ persona 2 ] [ persona 3 ]   ← tap → popup
4  ╭ See your Wrapped  (cyan gradient) ───────────────────╮
5  All-time stats card:   $3,162 spent · $1,500 income · 208 txns
6  Category breakdown (all-time, expandable → merchant drill-down)
7  Top Merchants  (bar graph, ranked by visits, spend per bar)
8  Your Affinities (progress-bar list, friendly labels)
   ✗ Detected Patterns — REMOVED
```

---

## 4. Header — two columns (replaces the centred block)

Currently the avatar + name + chips sit centred and eat vertical space. Restructure:

- **Left column:** avatar (keep the cyan-tinted initial circle, or photo), **name**
  (20/700), "Your Consumer DNA" eyebrow (13/500 `--text-secondary`). Left-aligned.
- **Right column:** the **recommendation card** (§5).
- **Remove the persona chips from here** — personas move to the showcase (§6).
- Below the two columns: a thin **cyan divider line** (1px, `--primary`, or a short
  gradient rule) separating the header from the persona showcase.

## 5. Recommendation card (text only, reuses Eron's top match)

- A compact `.nets-card`, **right of the header**. Eyebrow "✨ For you", then the **name**
  of Eron's #1 DNA-matched Explore item (event or activity), and its **reason line**
  ("Because you love live events"). A trailing chevron.
- **Text only — no image.**
- **Tap → navigate to the Explore tab.** (Reuse existing navigation; do not build new
  matching — §0.3 confirms the source.)
- Empty/loading state: "Finding your match…" → if none, hide the card gracefully.

## 6. Persona showcase (image-cards + popup) — the new signature moment

Reference feel: Airbuds / Spotify-Wrapped persona reveal.

- Section header **"Know your persona!"** + subtitle "Based on your spending habits:".
- Show the user's **top 3 personas** (derived from the existing persona logic /
  affinity vector — read it, don't change it).
- **Each persona card:** a fixed-aspect **image slot** (see §6.1) + the persona **name**
  below (e.g. "Bubble Tea Royalty"). 3 across (or horizontally scrollable on narrow
  widths). `.nets-card` styling, rounded image corners.
- **Tap a card → popup/modal:** the **larger image**, the **persona name**, and a
  **static description** (§6.2). A clear **Close** button. Smooth open/scale; backdrop dim;
  `prefers-reduced-motion` respected.

### 6.1 Persona image assets (leave empty slots for Calvin)
- Create the folder **`src/assets/personas/`**.
- Build a **persona registry** mapping every possible persona to an image filename, so
  whichever 3 surface, the right image loads. Use **kebab-case ids**:
  `bubble-tea-royalty.png`, `hawker-regular.png`, `cafe-dweller.png`,
  `cinema-hopper.png`, `fitness-junkie.png`, … (one per persona in the persona library —
  read the library and list them all in a `README.txt` inside the folder so Calvin knows
  exactly which files to drop in).
- **Image spec to document in that README:** square **600×600px**, PNG or WEBP,
  `object-fit: cover`.
- **Until a file exists, render a themed placeholder** (cyan-tint tile + the persona's
  category icon) so the slot looks intentional, never broken. The placeholder is the
  fallback whenever an image is missing.

### 6.2 Persona descriptions (Calvin writes — do NOT auto-generate)
- Each persona in the registry has a `description` string.
- **Leave these as clearly-marked placeholders** (e.g. `description: '' // TODO: Calvin`)
  and render an "Add description" placeholder in the popup if empty. **Do not write
  marketing/encouraging copy yourself** — Calvin supplies it. Just scaffold the field +
  the popup layout that displays it.

## 7. Wrapped entry

- Keep the existing **story-card Wrapped** behaviour; only re-skin to the new tokens/font.
- **CTA button → cyan gradient** (`linear-gradient(135deg,#00A6CB,#0DCAF0)`), white text,
  sparkle icon. **Remove the red** — red is reserved for spend/outflow and shouldn't badge
  the celebratory moment.

## 8. All-time stats + category breakdown

- **Stats card:** spent / income / txns in the `.nets-card`, big tabular numbers. **Label
  it "All-time"** (small eyebrow) so it reads as distinct from Calendar's "This Month"
  cashflow — they are intentionally different views, not duplicates.
- **Category breakdown (expandable):** keep the ranked rows (icon · category · % · $),
  cyan progress bars. **New: each category row expands** to reveal the **merchants under
  it** with per-merchant visit count + spend (the drill-down — gated by §0.2). Use an
  inset `--surface-muted` list inside the expanded row; smooth height expand; chevron
  rotates. This drill-down is what differentiates DNA's breakdown from Calendar's flat one.
- **Money colour rule:** category amounts stay neutral/`--text-primary`; don't paint them
  cyan.

## 9. Top Merchants — bar graph (ranked by visits)

Replace the current numbered list with a **horizontal bar graph**:

- **Ranked #1–#5 by visit count**; **bar length = visits**.
- Each bar: merchant **name** + small icon, the bar itself, and the **amount spent** shown
  on/beside the bar (tabular). Visit count labelled too.
- **Bar colour:** the cyan gradient, or a graduated cyan scale from #1 (strongest) down.
  Keep it within the brand — no rainbow.
- **Auto-updates** from the live `topMerchants` data; **bars animate (grow) on load**
  (gated by `prefers-reduced-motion`). No toggle — visits only.

## 10. Affinities — progress-bar list, friendly labels

- Keep the progress-bar list (Lunch 100%, Coffee 91%, …).
- **Run every label through `tagLabel()`** so "liveevents" → "Live Events", "music" →
  "Music", "Food Court" stays "Food Court", etc. **No raw tags.**
- Bars use `--primary`; percentages tabular, `--text-secondary`.

## 11. Remove Detected Patterns

- **Delete the Detected Patterns section from the DNA page** (and its now-unused markup/
  styles on this page). It already lives on the Calendar page; keep it only there. Leave
  the underlying pattern data/service intact — **only remove this page's rendering of it.**

## 12. Motion & quality floor

- Persona popup open, Wrapped CTA, category expand, top-merchant bar grow — all 200ms,
  `prefers-reduced-motion` respected. One signature moment (persona reveal); keep the rest
  quiet.
- Contrast AA; `--primary-glow` never as text. Tap targets ≥44px (persona cards, popup
  close, expand rows, recommendation card). Tabular numerals on all money/%. No horizontal
  overflow at 360–430px. Visible keyboard focus.

## 13. Build order — PAUSE after each

1. **Read & report** (§0) incl. both gate verdicts. *Pause.*
2. Two-column header + cyan divider; move persona chips out (§4). *Pause.*
3. Recommendation card reusing Eron's top match → taps to Explore (§5). *Pause.*
4. Persona showcase: cards + `assets/personas/` + registry + README + placeholder +
   popup (static description field) (§6). *Pause.*
5. Wrapped re-skin + cyan CTA (§7). *Pause.*
6. All-time stats label + category breakdown with merchant drill-down (§8). *Pause.*
7. Top Merchants bar graph (visits, spend shown, animated) (§9). *Pause.*
8. Affinities `tagLabel()` fix + remove Detected Patterns (§10–§11). *Pause.*
9. Motion + quality-floor audit at ~390px (§12).

## 14. Definition of done

- DNA page on the light system, fully consistent with Calendar/Explore/Pay; no red CTA.
- Header is two-column: name left, recommendation card right (reuses Eron's top match,
  taps to Explore).
- Persona showcase with 3 image-cards + popup; empty image slots + a `personas/README.txt`
  telling Calvin exactly which files/dimensions to drop in; static description field left
  for Calvin (not auto-written).
- Wrapped re-skinned with a cyan-gradient CTA.
- All-time stats + expandable category breakdown with per-category **merchant drill-down**;
  labelled distinct from Calendar.
- Top Merchants is an animated bar graph ranked by visits with spend shown.
- Affinities show friendly labels — no raw tags. Detected Patterns removed from this page.
- DNA computation, affinity formula, and Eron's match logic untouched.

## 15. Guardrails

- **Presentation/layout only.** Never alter the DNA computation, affinity formula, Eron's
  Explore matching, or the Wrapped data. UI-driven data change needed? **Stop and ask.**
- Don't build a new recommendation/matching algorithm — reuse Eron's existing top match.
- Don't auto-write persona descriptions — scaffold the field, Calvin fills it.
- Tokens only — no new hex, no redefining globals.
- Don't touch Calendar / Explore / Pay / Settings.
- Consult your **frontend-design** skill; one bold element (persona reveal), everything
  else quiet. Screenshot-verify each step at ~390px.