# UI-Upgrade.md — NETS Smart Calendar visual rework (Round 1)

> Briefs **Claude Code** to rework the **Calendar** experience of the NETS hackathon
> app (Ionic + Angular + Firebase) into a minimal, futuristic, Gen-Z/millennial look —
> while laying down a **global design foundation** (colour tokens, font, card system)
> the rest of the app will adopt in later rounds.
>
> The branches are already merged and the app runs. This round is **presentation/layout
> only** — do **not** rewrite Eron's data logic, Firestore wiring, or calendar/pattern
> computation. Change how it *looks and lays out*, not what it *computes*.

---

## 0. READ FIRST — order of reading, then pause

1. Read the attached **"NETS Smart Calendar — Complete UI/UX Breakdown"** PDF (Eron's
   own summary of the Calendar + Explore intent).
2. Read Eron's **Calendar page** files (`.page.html`, `.page.scss`, `.page.ts`), its
   **modals** (spending analytics, day view), and the **data models / interfaces** it
   renders. **Focus on layout and the data shape each view consumes — not on how the
   functions are implemented.** You need to know *what data is available to render*
   (dates, transactions per day, predicted plans, totals, patterns), not re-derive it.
3. Locate the **theme files** (`src/theme/variables.scss`, `global.scss`) and the tab
   bar.

Then **post: (a) a map of the Calendar's current components + the data each renders,
(b) where the white-on-light text bug and the timeline-overflow bug live in the markup,
(c) your build plan.** Pause for approval before editing.

---

## 1. Scope — what this round covers

**In scope (build fully):**
- Global **design tokens**, **DM Sans** font, **one card system**, spacing scale.
- Re-theme the **tab bar** to the new tokens.
- Full **Calendar page** rework: header + **Month/Week toggle**, **KPI chip strip**,
  **light calendar feature-card** with activity **dots** and **collapse-on-select**, and
  an **inline left-rail timeline** below it.
- The **day deep-dive screen** (full-day timeline) rebuilt as a **single left-rail**
  layout — kills the centre-spine overflow — with **PAID / PREDICTED / expanded** card
  variants and a **day-total** footer.
- Re-theme the **spending analytics modal** and **repurpose the top-right icon** (see §6).
- Fix the **white-on-light "Today's timeline" text bug** and restyle the **AI patterns**
  block.

**Out of scope (next round — do NOT redesign now):**
- The **Explore (Events)** page — only apply the global tokens so it doesn't look broken
  against the new theme; no layout rework.
- Full restyle of **Pay / Settings / DNA** — they inherit the global tokens automatically;
  their dedicated polish is a later round.

**Do not touch:** Eron's transaction/pattern/forecast computation, Firestore reads/writes,
or any business logic. Presentation only.

---

## 2. Design foundation (the global token system)

Define these as CSS custom properties in `variables.scss` (Ionic `:root`). Everything
downstream references tokens — no hard-coded hex in components.

### 2.1 Colour — named palette

| Token | Hex | Role |
|---|---|---|
| `--app-bg` | `#FAFAFA` | page background (Anti-Flash White — never pure `#FFFFFF`) |
| `--surface` | `#FFFFFF` | elevated cards |
| `--surface-muted` | `#F5F5F5` | chips, inset rows, dividers (White Smoke) |
| `--border-hairline` | `#ECECEC` | 1px card/edge definition on the light bg |
| `--primary` | `#00A6CB` | **brand / interactive only** — selected day, active tab, links, primary buttons, timeline rail |
| `--primary-glow` | `#0DCAF0` | accent/energy ONLY — gradient tips, glows, active-tab halo. **Never use as text or as a text background — it fails contrast.** |
| `--spent` | `#EA0029` | semantic: money out / spent / outflow (NETS red) |
| `--income` | `#16B364` | semantic: money in / income |
| `--predicted` | `#F5A524` | semantic: AI-predicted/planned (amber) |
| `--text-primary` | `#0B1A2B` | headings, amounts, primary text (deep navy, not black) |
| `--text-secondary` | `#6B7280` | labels, captions, timestamps |

**Hard rule — brand ≠ semantic.** Cyan means "interactive/brand." Money keeps its own
colours: spent = red, income = green, predicted = amber. Do **not** colour dollar amounts
cyan, or the app turns into "cyan soup."

Signature gradient (use sparingly — rail, selected pill, one hero accent):
`linear-gradient(135deg, #00A6CB 0%, #0DCAF0 100%)`.

### 2.2 Typography — DM Sans, one family

- Load **DM Sans** (Google Fonts) weights 400/500/600/700. Set as the global font;
  remove the existing `sans-serif` default.
- **All monetary values and times use tabular figures:**
  `font-variant-numeric: tabular-nums;` (so columns of dollars align).

Type scale:

| Role | Size / Weight | Notes |
|---|---|---|
| Display (KPI totals, Day Total) | 28px / 700 | tabular |
| Month label / screen title | 20px / 600 | |
| Section header ("Today's timeline") | 16px / 600 | sentence case |
| Body / merchant name | 15px / 600 (name), 15px / 400 (body) | |
| Label / caption | 13px / 500 | `--text-secondary` |
| Micro (timestamps, pills) | 12px / 500 | tabular for times |

### 2.3 Spacing, radius, shadow

- **8pt grid:** spacing tokens 4 / 8 / 12 / 16 / 20 / 24 / 32.
- **Radius:** cards `20px`, inner chips/pills `12px`, full pills `999px`.
- **Card shadow (soft, low):** `0 2px 10px rgba(11,26,43,0.06)` **plus**
  `1px solid var(--border-hairline)` for crisp definition on `#FAFAFA`.
- **One card class** (e.g. `.nets-card`): `--surface` bg, radius 20, the shadow+hairline
  above, padding 16. Every card in the rework uses it — no bespoke card styles.

### 2.4 Motion (restrained — see §7 for where)

- Standard transition: `200ms cubic-bezier(0.4, 0, 0.2, 1)`.
- Respect `prefers-reduced-motion`: disable transforms/auto-animations when set.

---

## 3. Global setup tasks (do before the Calendar work)

1. Add DM Sans; wire the type scale + tabular-nums globally.
2. Define all tokens in §2.1; set `ion-content` / page background to `--app-bg`.
3. Create the shared `.nets-card`.
4. Re-theme the **tab bar**: `--surface` bg, hairline top border, inactive icons
   `--text-secondary`, **active tab = `--primary`** with a soft `--primary-glow` halo.
   Keep the existing 4 tabs (Calendar · Explore · Pay · DNA).

Pause after global setup so we can eyeball the foundation before the Calendar build.

---

## 4. Calendar page rework

Target: **Image-1 reference** — an airy, **light calendar feature-card** floating on the
`#FAFAFA` page, minimal cells, **dots not data-dumps**, selecting a day **collapses the
calendar** to hand space to an **inline timeline** below.

### 4.1 Layout (top → bottom)

```
┌─────────────────────────────────────────┐
│  NETS Insights            🔵 (help icon) │  ← header, help icon top-right (§6)
├─────────────────────────────────────────┤
│  [ Month | Week ]   June 2026   ‹  ›     │  ← segmented toggle + month nav
│  ┌ spent ─┐ ┌ income ┐ ┌ txns ┐          │  ← slim KPI chip strip (§4.3)
│  │ $3,149 │ │ $1,500 │ │ 199  │          │
├─────────────────────────────────────────┤
│  ╭───────── calendar feature-card ─────╮ │  ← .nets-card, light (§4.4)
│  │  Sun Mon Tue Wed Thu Fri Sat        │ │
│  │   1   2  (3)  4   5   6   7          │ │  ← selected day = cyan pill
│  │   •       •           •             │ │  ← activity dots under days
│  │   8   9  10  11  12  13  14         │ │
│  ╰─────────────────────────────────────╯ │
├─────────────────────────────────────────┤
│  Today's timeline                        │  ← section header (FIX white text)
│  │● 12:15  ┌ Jollibee  -$11.02  PAID ┐  │  ← single LEFT rail timeline (§4.5)
│  │● 15:30  ┌ KOI        -$5.40  PAID ┐  │
│  │● 19:00  ┌ ActiveSG   -$2.16  PAID ┐  │
├─────────────────────────────────────────┤
│  ✨ Your patterns                        │  ← restyled AI block (§4.6)
└─────────────────────────────────────────┘
```

### 4.2 Header + Month/Week toggle

- A segmented control **`Month | Week`** (pill, `--surface-muted` track, active segment
  `--primary` text on white). Default **Month**.
- **Month view:** standard 6-row grid. Render leading/trailing days from adjacent months
  **very faint and disabled** (non-interactive) — or omit them; do **not** show them at
  full strength (this removes the "next month bleeding in" noise).
- **Week view:** a single row of the selected week (the Image-1 look) — 7 day columns,
  bigger tap targets, ideal for scanning one week's plan.
- Month nav arrows `‹ ›` change month (or week). Keep Eron's date logic.

### 4.3 KPI chip strip (replaces the 3 big KPI cards)

- One slim horizontal row of three chips under the month header: **Spent** (value in
  `--spent`), **Income** (`--income`), **Txns** (neutral). 12–13px labels, value bold.
- Compact: this frees the vertical space the old large cards stole from the grid.
- Tapping **Spent/Income** opens the "This Month" modal (§6).

### 4.4 Calendar feature-card

- A `.nets-card`, light. Weekday header row in `--text-secondary` (Sun/Sat may use a
  faint red tint, optional).
- **Day cell:** just the number, centered, generous tap target (≥40px). **No $ amount, no
  txn-count pill inside the cell.**
- **Activity dots (this is the only per-day signal — keep it meaningful):**
  - a small **cyan dot** if the day has **actual transactions**,
  - a small **amber dot** if the day has **only predicted/planned** items,
  - **both dots** (cyan + amber) if it has both. Max two dots; never a number.
- **Selected day:** the number sits inside a filled **cyan pill/circle**
  (Image-1 style, our `--primary`), white number. **Today** (if not selected): a thin
  cyan ring.
- **Collapse-on-select:** when a day is tapped, the calendar card **animates to a
  compact height** (Month → a single week row containing the selected day, or a reduced
  card) so the **inline timeline (§4.5)** gets room. A small "expand calendar" affordance
  restores full height.

### 4.5 Inline timeline (single LEFT rail) — under the calendar

Reference: **Image 3 (Moves-style)**. **The rail is on the LEFT. Never centre it.**

- **Rail:** a vertical line near the left edge (~`x: 32px`), 2px, coloured with the
  signature cyan gradient (or segment-coloured per item).
- **Time label:** left of the rail, 12px `--text-secondary`, tabular.
- **Node:** a pill/circle on the rail (~36px), `--surface`, holding the **category icon**
  (cyan-tinted). Ring colour encodes state: `--spent` red ring (paid outflow),
  `--predicted` amber ring (predicted).
- **Event card:** to the **right of the rail, full remaining width** (`.nets-card`).
  Contains: merchant **name** (15/600), category sub-label (13/500 secondary), **amount
  right-aligned** (`--spent` for outflow, tabular), a state **pill** (PAID / PREDICTED),
  and a "Tap for details" chevron.
- This full-width-right layout is what **permanently fixes the off-screen clipping** seen
  in the current centre-spine version (KOI / Bubble Tea cards being cut off).
- If the selected day has no items: an **empty state** — "Nothing here yet. Plan
  something or make a payment." (invitation to act, not a blank).

### 4.6 Fixes on this page

- **White-on-light text bug:** "Today's timeline" + any event text currently rendering
  white on the light page → set to `--text-primary` / `--text-secondary`. Audit the whole
  page for leftover dark-theme text/background tokens and replace with the new system.
- **AI "Your patterns" block:** rebuild as a clean `.nets-card`. Each pattern row =
  small trend icon + label (e.g. "Coffee · daily") + **match %** + a **streak pill**.
  Streak pill uses `--primary` (not the current harsh blue). Keep Eron's pattern data;
  just restyle. Header: "✨ Your patterns".

---

## 5. Day deep-dive screen (full-day timeline)

Reached by tapping a day's "Tap for details" / a day cell into the full view (Images
3/5/6). Rebuild on the **same single LEFT-rail** component from §4.5 so the two timelines
share one implementation. Header: weekday + date (e.g. "Tuesday — 2026-06-23").

**One card, three variants:**
- **PAID (actual):** red accent. "PAID" pill in `--spent`. Amount in `--spent`.
- **PREDICTED (AI plan):** amber accent + amber left-edge or dashed treatment.
  "PREDICTED" pill in `--predicted`, subtitle **"Based on your DNA"**, `est. $X.XX`
  amount, and a **dismiss (trash) control** to remove a predicted plan (as in Image 5).
- **Expanded:** tapping a card expands it in place to reveal **Transaction details** —
  Merchant / Category / Payment: **NETS Pay** — in an inset `--surface-muted` block
  (Image 6). Smooth height expand.

**Day-total footer card** (`.nets-card`, pinned at bottom of the list):
- `Planned   ~$X.XX` (label `--text-secondary`, value `--primary`)
- `Spent     -$X.XX` (value `--spent`)
- divider
- `Day Total  $X.XX` (20/700, `--text-primary`, tabular)

Make sure long merchant names truncate with ellipsis rather than overflowing, and every
card respects the screen's horizontal padding (no edge bleed).

---

## 6. Top-right icon → Help/tutorial, and the analytics modal

- **Repurpose the top-right pie-chart icon → a Help/tutorial icon** (e.g. a question
  or info glyph). It opens a lightweight **coach-mark / intro overlay** explaining the
  calendar's features: the Month/Week toggle, what the dots mean (cyan = spent, amber =
  predicted), tapping a day for its timeline, and PAID vs PREDICTED. Keep copy short,
  active voice, sentence case. For this round a simple swipe-through overlay (3–4 cards)
  is enough.
- **The spending-analytics modal:** re-theme it to the new tokens (light, `.nets-card`,
  cyan/red/green bars with animated fill, real category icons, sorted desc, % shown).
  **Relabel its header to "This Month"** and ensure it shows **this-month cash-flow only**
  (total spent / income + this month's category split). This deliberately makes it
  **different from the DNA page's all-time identity breakdown** — they must not read as
  twins. Keep it reachable via the KPI chips (§4.3). Do **not** duplicate the all-time DNA
  breakdown here.

---

## 7. Motion (where, specifically)

- **Calendar collapse/expand** on day-select: smooth height + opacity (200ms).
- **Timeline rail "draws in"** on view load: the cyan rail grows top→bottom, nodes fade in
  staggered (~40ms apart). One orchestrated entrance, not scattered effects.
- **Analytics bars** fill from 0 → value on open.
- **Card expand** (day details): animated height.
- **Active tab:** soft glow transition.
- All gated by `prefers-reduced-motion`. Nothing bounces or loops ambiently.

## 8. Quality floor

- Contrast: body/amount text uses `--text-primary`/`--text-secondary` on light — verify
  AA. **`--primary-glow` (#0DCAF0) and `--predicted` are never used as text.**
- Tap targets ≥44px (day cells, pills, dismiss control).
- Visible keyboard focus on interactive elements.
- Tabular numerals on all money + time.
- Responsive at 360–430px width; no horizontal overflow anywhere (this is the bug we're
  killing — test it).

## 9. Signature element (the one thing to get right)

**The cyan day-rail.** A single left timeline rail painted in the `#00A6CB → #0DCAF0`
gradient, with white category-icon nodes, that **draws itself in** on load and visually
**pulses where money moved** (paid nodes ringed red, predicted nodes ringed amber). It is
the memorable, "this is NETS" moment — the calendar and cards around it stay quiet and
disciplined so the rail carries the personality. Spend the boldness here; keep everything
else restrained.

## 10. Build order — PAUSE after each

1. **Read & report** (§0). *Pause.*
2. Global tokens + DM Sans + `.nets-card` + tab-bar retheme (§2–§3). *Pause.*
3. Calendar header + Month/Week toggle + KPI chip strip (§4.2–§4.3). *Pause.*
4. Calendar feature-card: dots, selected state, collapse-on-select (§4.4). *Pause.*
5. Single left-rail **timeline component** (shared) + inline use under calendar +
   white-text/AI-patterns fixes (§4.5–§4.6). *Pause.*
6. Day deep-dive screen: PAID/PREDICTED/expanded variants + day-total footer (§5). *Pause.*
7. Help/tutorial overlay + analytics modal retheme → "This Month" (§6). *Pause.*
8. Motion pass + quality-floor audit; apply tokens to Explore so it isn't broken (§7–§8).

## 11. Definition of done

- One global token system + DM Sans + one card style live; tab bar re-themed; active = cyan.
- Calendar is the light Image-1 feature-card: Month/Week toggle, KPI chip strip, dots
  (cyan/amber), cyan selected pill, collapses on select.
- **No timeline overflow anywhere** — single left rail, full-width right cards, on both
  the inline and day-deep-dive timelines.
- PAID/PREDICTED/expanded card variants + day-total footer match Images 5/6 cleanly.
- White-on-light text bug gone; AI patterns block restyled.
- Top-right icon = help/tutorial; analytics modal re-themed as "This Month," not a DNA twin.
- Explore at least adopts the tokens (no full rework). Eron's data/logic untouched.

## 12. Guardrails

- Presentation/layout only — **never** alter Eron's computation, Firestore, or pattern/
  forecast logic. If a layout change seems to require a data change, **stop and ask.**
- No hard-coded colours — tokens only.
- Don't redesign Explore or fully restyle Pay/Settings/DNA this round.
- Consult your **frontend-design** skill while building; keep one bold element (the rail)
  and everything else quiet.
- After each step, screenshot/verify on a ~390px viewport before moving on.