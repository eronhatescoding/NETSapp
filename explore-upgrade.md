# Explore-Upgrade.md — NETS Explore page rework (Round 2)

> Briefs **Claude Code** to bring the **Explore** page (Events + Activities) onto the
> light design system already live in Calendar / Pay / DNA, unify its components, fix the
> broken Activities screens, humanise the DNA tags, and add a **top search + filter
> dropdown**.
>
> The global token system, **DM Sans**, and `.nets-card` already exist from the Calendar
> round — Explore must **adopt** them, not redefine them. This round is
> **presentation/layout only**: do **not** change Eron's Ticketmaster API calls, the
> DNA-match scoring, or any data/function logic. If a UI change seems to need a data
> change, **stop and ask.**

---

## 0. READ FIRST — investigate, report, then pause

Do not edit anything yet. Read the Explore-related files and **answer four questions**:

1. **Layout map.** Read the Explore page (`.page.html/.scss/.ts`), the **Events list**,
   **Activities list**, the **Events/Activities toggle**, the **Event detail**, the
   **Activity detail**, and the **data models/interfaces** each renders. Map the
   components and the data each consumes (image URL, title, date, venue/location, price,
   match %, tags, description).
2. **Why are Activity photos blank?** (imgs 4) — confirm whether activity items have an
   image source at all. Likely they don't (no Ticketmaster source for activities). Report
   the actual reason; the fix is a placeholder tile (§5), but confirm the data first.
3. **Is there a tag→label mapping anywhere?** Raw tags like `ent:liveevents` and
   `fnb:coffee fnb:cafe fnb:workshop` are leaking to the UI (imgs 3, 5). Find whether any
   mapping exists and **why it isn't applied**. We will define/centralise one in §6.
4. **Filter feasibility (critical — read before promising the feature).** The new filter
   (§7) needs structured **genre** and **venue** fields.
   - **Venue** clearly exists (cards show "Arena @ EXPO", "Singapore Indoor Stadium",
     "The Theatre at Mediacorp"). Confirm it's a queryable field and whether a clean
     unique list can be derived from the data.
   - **Genre** may **not** exist as a structured field (Ticketmaster returns
     classifications/genres, but Eron may not have extracted them). **Report whether a
     genre field exists.** If it does not, do **not** invent it — propose options
     (derive from the item's `tags`, pull from the Ticketmaster classification if
     present, or ship venue-only filtering this round) and wait for a decision.

**Post: the layout map, the photo + tag-mapping findings, the filter-feasibility verdict,
and a build plan. Then pause for approval.** Build only after sign-off.

---

## 1. Scope

**In scope (Explore only):**
- Re-theme the whole page to the live tokens (kill the dark navy background).
- **Unify** the Events + Activities lists into **one card component**, and the Event +
  Activity detail pages into **one detail template** (§4–§5).
- **Hero-expand the top DNA match**, collapse the rest (for **both** Events and
  Activities) (§4, §9).
- **Placeholder tiles** for items with no image (activities) (§5).
- **Tag → friendly label** map, applied everywhere (§6).
- **NEW: top search + filter dropdown** with checkbox groups — *only if §0.4 confirms the
  data supports it* (§7).
- Re-theme/reformat the two detail pages, fixing the broken Activity detail (§5, §8).

**Out of scope (do NOT touch):**
- **Pay / Settings / DNA** — already on the new theme.
- **Calendar** — done.
- **Eron's logic** — Ticketmaster API, DNA-match scoring, the two action buttons'
  behaviour. **Restyle the buttons; never change what they do** (see §5).

---

## 2. Design foundation (already live — adopt, don't redefine)

These tokens exist globally from the Calendar round. Reference them; add no new hex.

| Token | Hex | Role |
|---|---|---|
| `--app-bg` | `#FAFAFA` | page background (the dark navy on Explore must go) |
| `--surface` | `#FFFFFF` | cards |
| `--surface-muted` | `#F5F5F5` | chips, inset rows, dividers |
| `--border-hairline` | `#ECECEC` | 1px definition |
| `--primary` | `#00A6CB` | brand/interactive: match badge, active toggle, primary button, links |
| `--primary-glow` | `#0DCAF0` | accent/gradient only — never as text |
| `--spent` | `#EA0029` | money out |
| `--income` | `#16B364` | money in / positive |
| `--predicted` | `#F5A524` | planned/AI |
| `--text-primary` | `#0B1A2B` | titles, prices |
| `--text-secondary` | `#6B7280` | labels, captions |

Font: **DM Sans** (already global). Prices use `font-variant-numeric: tabular-nums`.
Cards: the shared **`.nets-card`** (radius 20, soft shadow + hairline, padding 16).
Signature gradient (sparingly): `linear-gradient(135deg, #00A6CB, #0DCAF0)`.

---

## 3. Global page fix

- Set the Explore `ion-content` background to `--app-bg`; remove the dark navy surface.
- Audit for the **white-on-light low-contrast bug** (activity titles/prices nearly
  invisible in img 4 — same bug fixed on Calendar). All text → `--text-primary` /
  `--text-secondary`.
- Header: NETS wordmark + "Explore" + refresh icon, on `--surface`, hairline bottom.
- The Events/Activities **toggle** = a segmented pill: `--surface-muted` track, **active
  segment = `--primary`** (cyan), inactive `--text-secondary`. (Currently the active
  state uses the old NETS blue — switch to cyan.)

---

## 4. Unified list card (Events + Activities share ONE component)

Reference: imgs 1–2 (events already do this well). Make Activities use the **same**
component so they inherit the polish.

```
HERO (top match)                       COLLAPSED (rest)
┌──────────────────────────────┐      ┌──────────────────────────────┐
│ [ image / placeholder ]      │      │ [thumb]  CONCERT      ◑ 93% │
│  ◑ 93% match                 │      │          Title two lines…    │
│ Title                        │      │          Fri 3 Jul · Venue   │
│ Wed 1 Jul · Arena @ EXPO     │      │          Because you love…   │
│ Because you love live events │      │          $150                │
│ From $150                    │      └──────────────────────────────┘
└──────────────────────────────┘
```

- **Hero card** (top DNA match): full-width image (or placeholder), a **match badge**
  overlaid top-left, title, date·venue, the **reason line** ("Because you love live
  events" — *keep this, it's the DNA explainability hook*), and price.
- **Collapsed cards**: left thumbnail (or placeholder), category eyebrow, 2-line title,
  date·venue, reason line, price, and the **match badge**.
- **One match badge style everywhere**: a cyan pill (`--primary` text on a
  `--primary` 12% tint, or solid cyan on the hero image). **Drop the green-vs-blue
  inconsistency** (img 1 hero blue vs collapsed green) — one treatment for both lists.
- Tap a card → unified detail (§5).

---

## 5. Unified detail template (Events + Activities share ONE template)

Reference: img 3 (Event detail — your strongest layout). Rebuild **Activity detail on the
same template** so the broken version (img 5) inherits all of it.

Top → bottom:
1. **Hero image** (or placeholder tile, §5.1) with a back button; **DNA-match circle**
   centred over it — recolour to **cyan** (`--primary`), keep the "DNA MATCH" caption.
2. **Title** (20–22 / 700, `--text-primary`).
3. **Date · Venue** (events) / **Location · distance** (activities) — icon + text row,
   `--text-secondary`.
4. **Description** (or a clean empty state: "No description available." — not raw/blank).
5. **Tag chips** — friendly labels from §6 (e.g. *Live Events · Music* / *Coffee · Café ·
   Workshop*), **never raw `ent:`/`fnb:` strings**. Chips = `--surface-muted` bg, rounded.
6. **Two stat cards** side by side: **Ticket price / Est. cost** and **Your match %**
   (`.nets-card`, big tabular number).
7. **Two action buttons** (restyle ONLY — see guardrail):
   - **Secondary:** "Add to Calendar" — outline/`--surface-muted`, cyan text + icon.
   - **Primary:** "Buy with NETS Pay" (events) / "Book activity" (activities) — solid
     **cyan gradient**, white text. (Replace the old solid NETS-blue button.)

> **GUARDRAIL — buttons:** change appearance only. Do **not** touch their click handlers,
> routing, the simulated Pay flow, or the add-to-calendar write. Function stays exactly
> as built.

### 5.1 Placeholder tile (activities with no image)
When `imageUrl` is missing/empty, render a **category placeholder**: a tile filled with a
soft cyan tint (`--primary` ~10%) and the **category icon** centred (Coffee / Dining /
Nightlife / Workshop / etc.), not a broken/blank box. Same placeholder used in list
thumbnails and the detail hero. Give it an `aria-label` of the category.

---

## 6. Tag → display-label map (humanise the DNA tags)

First apply whatever mapping §0.3 found (and fix why it wasn't applied). Centralise a
single map + a **fallback formatter** so no raw tag ever reaches the UI.

Starter map (extend to cover **every** tag in the merchant/DNA taxonomy — read the
catalogue):

```ts
const TAG_LABELS: Record<string,string> = {
  // Entertainment
  'ent:liveevents':'Live Events','ent:music':'Music','ent:cinema':'Cinema',
  'ent:arcade':'Arcade','ent:ktv':'KTV','ent:nightlife':'Nightlife','ent:gaming':'Gaming',
  // Food & Beverage
  'fnb:coffee':'Coffee','fnb:cafe':'Café','fnb:workshop':'Workshop',
  'fnb:bubbletea':'Bubble Tea','fnb:drinks':'Drinks','fnb:hawker':'Hawker',
  'fnb:chinese':'Chinese','fnb:western':'Western','fnb:japanese':'Japanese',
  'fnb:korean':'Korean','fnb:malay':'Malay','fnb:indian':'Indian','fnb:thai':'Thai',
  'fnb:lunch':'Lunch','fnb:dinner':'Dinner','fnb:breakfast':'Breakfast','fnb:supper':'Supper',
  // Shopping / Fitness / etc.
  'shopping:fashion':'Fashion','shopping:beauty':'Beauty','shopping:electronics':'Electronics',
  'shopping:groceries':'Groceries','fitness:gym':'Gym','fitness:studio':'Studio',
  'fitness:sports':'Sports',
};
// Fallback so nothing raw ever shows: strip prefix → title-case
function tagLabel(t: string){ return TAG_LABELS[t] ?? t.split(':').pop()!
  .replace(/(^|\s)\S/g, c => c.toUpperCase()); }
```

Apply `tagLabel()` to every tag chip across list cards and both detail pages.

---

## 7. Top search + filter dropdown (NEW — only if §0.4 confirms the data)

A search bar already exists; pair it with a filter affordance that opens a **dropdown
panel sliding down from the top** (below the header/search), not a full-screen modal.

```
┌─────────────────────────────────────┐
│ 🔍 Search events & activities…   ⚙︎ │  ← filter button (right of search)
├─────────────────────────────────────┤   ↓ panel slides down when opened
│  Genre                              │
│   ☐ Chinese  ☐ K-pop  ☐ English     │
│  Venue                              │
│   ☐ Capitol Theatre ☐ Arena @ EXPO  │
│   ☐ Singapore Indoor Stadium …      │
│            [ Clear ]   [ Apply ]    │
└─────────────────────────────────────┘
   active filters → chips under the search bar
```

- **Checkbox groups**, context-aware by toggle:
  - **Events:** *Genre* + *Venue*.
  - **Activities:** *Category* (Workshop/Dining/Nightlife/…) + *Area* (Star Vista/JEM/
    Clarke Quay/…).
- **Derive options from the data** (unique venues/areas/categories) rather than
  hardcoding, so the lists stay correct as data changes.
- **Genre is conditional:** include it only if §0.4 found a genre field. If not, ship
  **venue/area + category** filtering this round and leave a `// TODO: genre` hook —
  do not fabricate genres.
- **Apply** filters the current list (Events or Activities) client-side over already
  loaded data; **Clear** resets. Show **active filters as removable chips** under the
  search bar. Search + filters combine (AND).
- Keep it presentation-level: filter/search over the in-memory list. **Do not** change
  Eron's API fetch.

---

## 8. Activities-specific fixes

- **Photos:** apply the §5.1 placeholder wherever an image is missing (the root cause from
  §0.2). No blank blue boxes.
- **Activity detail reformat (img 5 is the worst screen):**
  - Replace the run-together `Estimated Cost~$45` / `Your Match99%` with the **two labelled
    stat cards** from §5 (proper spacing + hierarchy).
  - Raw `fnb:coffee fnb:cafe fnb:workshop` → friendly **tag chips** via §6.
  - Drop the off-brand **purple** gradient bar → cyan `--primary` (or the signature
    gradient) consistent with the match circle.
  - Style the "When do you want to do this?" date/time pickers + "Add to Calendar" to the
    new system (function untouched).
- Activities use the **same hero-expand list** as Events (§9).

---

## 9. Hero pattern for Activities

Mirror Events: the **top DNA-match activity** renders as the hero card (large image/
placeholder + match badge + reason line), the rest collapse into compact cards with their
match badge. Same component as §4.

---

## 10. Motion (restrained)

- Filter dropdown: smooth **slide-down + fade** (200ms); rotate the filter icon on open.
- **DNA-match circle** on detail: count-up / ring-fill on load.
- List → detail: standard Ionic page transition; card press = subtle scale.
- Gate everything on `prefers-reduced-motion`.

## 11. Quality floor

- Contrast AA on all text (this page currently fails it). `--primary-glow` never as text.
- Tap targets ≥44px (cards, toggle, checkboxes, filter button, action buttons).
- Prices tabular; no horizontal overflow at 360–430px; titles clamp to 2 lines with
  ellipsis.
- Placeholder tiles carry an accessible label; images have alt text.
- Visible keyboard focus on search, checkboxes, buttons.

## 12. Build order — PAUSE after each

1. **Read & report** (§0) incl. the filter-feasibility verdict. *Pause.*
2. Page re-theme: background, contrast fixes, header, Events/Activities toggle → cyan
   (§3). *Pause.*
3. Tag→label map + fallback, applied across cards + both details (§6). *Pause.*
4. Unified **list card** (hero-expand + collapsed + one match badge + placeholder) for
   both lists (§4, §5.1, §9). *Pause.*
5. Unified **detail template**; rebuild Activity detail on it; restyle (not rewire) the
   two buttons (§5, §8). *Pause.*
6. **Search + filter dropdown** per the §0.4 verdict (§7). *Pause.*
7. Motion + quality-floor audit at ~390px (§10–§11).

## 13. Definition of done

- Explore is on `--app-bg` white with cyan primary, consistent with Calendar/Pay/DNA;
  contrast bug gone.
- Events + Activities share one list card and one detail template; both hero-expand the
  top match with a single consistent cyan match badge; reason lines kept.
- No raw tags anywhere — all friendly labels; activity detail is clean and legible.
- Activities show category placeholder tiles instead of blank boxes.
- Search + filter dropdown works per the confirmed data (venue/area + category at minimum;
  genre only if the field exists).
- The two action buttons look new but behave exactly as before; Eron's API + match logic
  untouched.

## 14. Guardrails

- **Presentation/layout only.** Never change Eron's Ticketmaster fetch, DNA-match scoring,
  or the action buttons' behaviour. UI-driven data change needed? **Stop and ask.**
- **Read before the filter.** Don't build genre filtering unless §0.4 confirms the field;
  don't fabricate genres.
- Tokens only — no new hex, no redefining the global system.
- Don't touch Pay / Settings / DNA / Calendar.
- Consult your **frontend-design** skill; keep one bold element (the cyan match circle/
  hero) and everything else quiet. Screenshot-verify each step at ~390px.