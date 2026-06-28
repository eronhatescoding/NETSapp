# CLAUDE.md — NETS "Consumer DNA" + Payment + Concierge Wrapped

> This file briefs **Claude Code** for work on Calvin's portion of a PolyFintech
> hackathon prototype: the **NETS app reimagined as a local everyday day-planner**
> for Gen Z / millennials in Singapore. The product loop is: *NETS transactions →
> tagged spending → a **User DNA** (tag-affinity profile) → personalised
> recommendations + a Spotify-Wrapped-style identity summary.*

---

## 0. READ FIRST — do this before writing any code

**Do not start editing. First read the whole project and report back what you find.**
Specifically open and summarise:

- The **tabs routing / shell** (e.g. `src/app/tabs/`, `tabs.routes.ts`,
  `tabs.page.html`) — how the current 3 tabs (Calendar, Explore, Insights) are wired.
- **`user-dna.service.ts`** (Eron's existing, currently hardcoded). Report its exact
  data shapes: how a transaction looks, how categories/patterns are represented, what
  it exposes. **My new code must extend this model, not fork it.**
- The current **Insights page** component (`.ts/.html/.scss`) — the one rendering
  "Your Consumer DNA", "Detected Patterns", and "Category Breakdown" in the
  screenshots. This page will be **rebuilt** (see §6).
- **Theme files** (`src/theme/variables.scss`, `global.scss`) and how colours are
  currently applied.
- **Firebase config** (`environment.ts`, AngularFire setup) — confirm Firestore is
  available and how it's initialised.

After reading, **post a short summary + a proposed plan, then pause for my approval.**
Then proceed section by section, pausing after each numbered build step in §11.

---

## 1. Hard boundaries — what you must NOT touch

This is a shared codebase. Eron owns the **Calendar** and **Explore (Events)** pages
and the **recommendation/matching + location logic**.

- ❌ Do **not** restyle, refactor, or edit the **Calendar** or **Explore** pages.
- ❌ Do **not** write merchant-similarity, recommendation, or location logic — that is
  Eron's. My job stops at **producing the DNA**; he consumes it.
- ❌ Do **not** apply a global theme that changes Eron's pages. Theme changes must be
  **scoped to my pages only** (DNA, Pay, Settings) — see §9.
- ✅ I **may** read and **carefully extend** `user-dna.service.ts` (shared model), but
  preserve its existing public shape so Eron's code keeps working. If a change to it is
  unavoidable, flag it explicitly and explain the impact before doing it.

When in doubt about whether something is "mine", **ask before editing.**

---

## 2. Stack

Ionic + Angular (standalone or modules — match whatever the repo already uses) +
Firebase/Firestore. TypeScript. Keep to the project's existing conventions, file
structure, and lint rules. Reuse existing services/utilities rather than duplicating.

When building UI, consult your own **frontend-design** skill for layout/typography
discipline — this needs to look clean and intentional, not templated.

---

## 3. Tab structure (decision — change in one place if Calvin disagrees)

Final bottom tabs: **`Calendar | Explore | Pay | DNA`** (4 tabs).

- Rename the existing **Insights** tab → **DNA** (label + route + icon → a DNA/helix or
  person icon).
- Add a new **Pay** tab (centre-ish, prominent — it's the core loop driver).
- **Settings** is **not** a bottom tab. It's a **gear icon in the DNA page header**
  (DNA doubles as the profile page). *If Calvin wants Settings as its own 5th tab
  instead, that's the only thing to change here — add it to the tabs config and a route.*

---

## 4. Data model (extend `user-dna.service.ts`; create what's missing)

Read the existing model first, then align to these shapes (rename to match repo style).

### 4.1 Tag taxonomy (the backbone of the whole DNA)
A **hierarchical tag system**: every merchant carries tags; a transaction inherits its
merchant's tags. Keep top-level categories aligned with the existing "Category
Breakdown" (Food & Beverage, Shopping, Entertainment, Education, Fitness) and extend:

```
Food & Beverage
  meal:        breakfast | lunch | dinner | supper
  cuisine:     chinese | western | japanese | korean | malay | indian | thai | fastfood
  drinks:      bubbletea | coffee | juice
  setting:     hawker | foodcourt | cafe | restaurant | fastfood
Shopping
  fashion | beauty | electronics | groceries | convenience | lifestyle
Entertainment
  cinema | arcade | ktv | gaming | liveevents | nightlife
Fitness
  gym | studio | sports
Education
  books | courses | stationery
Transport
  ridehailing | transit | fuel
Lifestyle & Services
  telco | subscription | wellness
```

Represent tags as strings namespaced `category:subtag` (e.g. `fnb:bubbletea`,
`shopping:fashion`). A merchant has an array of these.

### 4.2 Core interfaces (illustrative — conform to existing names/types)

```ts
interface Merchant {
  id: string;
  name: string;            // "Gong Cha"
  category: Category;      // top-level, matches Category Breakdown
  tags: string[];          // ["fnb:bubbletea", "fnb:drinks"]
  typicalAmount: number;   // for realistic simulated spend
  icon?: string;           // ionicon name or asset
}

interface Transaction {
  id: string;
  userId: string;
  merchantId: string;
  amount: number;          // SGD
  timestamp: Timestamp;    // Firestore
  tags: string[];          // denormalised copy from merchant at pay-time
  category: Category;
}

interface TagAffinity {
  tag: string;
  weight: number;          // 0..1 normalised
  count: number;           // # of txns
  totalSpend: number;
  lastSeen: Timestamp;
}

interface UserDNA {
  userId: string;
  generatedAt: Timestamp;
  totals: { spent: number; income: number; txnCount: number };
  categoryBreakdown: { category: Category; amount: number; pct: number }[];
  topMerchants: { merchantId: string; name: string; count: number; spend: number }[];
  affinityVector: TagAffinity[];     // ← the thing Eron consumes
  personas: Persona[];               // ← drives the Wrapped (see §8)
}
```

---

## 5. Merchant catalogue (generate a rich, Singapore-real seed)

Create a typed catalogue of **~45–60 Singapore Gen-Z/millennial merchants**, each fully
tagged. More merchants + more tags = a richer DNA showcase, which is the point. Seed it
into a Firestore `merchants` collection (see §10). Use real local brands. Starter set to
extend (don't stop here — flesh it out):

- **Bubble tea:** Gong Cha, LiHO, KOI, iTEA, Playmade, CHICHA San Chen, R&B Tea, Mr Coconut
- **Coffee/cafe:** Starbucks, Ya Kun, Toast Box, Flash Coffee, Huggs, The Coffee Bean, Luckin Coffee
- **Fast food:** McDonald's, KFC, Burger King, Subway, Jollibee, MOS Burger, Shake Shack
- **Western/casual:** ASTONS, Saizeriya, Swensen's, PastaMania, Collin's, Fish & Co
- **Japanese:** Sushi Tei, Genki Sushi, Ichiban Sushi, Sushiro, Ramen Keisuke
- **Korean:** Seoul Garden, Kko Kko Nara
- **Local/hawker:** Old Chang Kee, Encik Tan, Koufu, Food Republic, Kopitiam
- **Groceries/convenience:** FairPrice, Sheng Siong, Cold Storage, 7-Eleven, Cheers
- **Fashion:** Uniqlo, H&M, Cotton On, Love Bonito, Zara, Decathlon
- **Beauty:** Sephora, Watsons, Guardian, Innisfree
- **Electronics:** Challenger, Courts, Apple
- **Entertainment:** Golden Village, Shaw Theatres, Cathay Cineplexes, Timezone, Teo Heng KTV, Zouk
- **Fitness:** ActiveSG, Anytime Fitness, Snap Fitness, Ground Zero, Yoga Movement, Boulder Movement
- **Transport:** Grab, Gojek, SimplyGo, Shell, Esso
- **Education:** Popular, Kinokuniya, Times
- **Subscriptions/telco:** Spotify, Netflix, Singtel, StarHub, Circles.Life

Each entry needs `name`, top-level `category`, a sensible `tags[]`, a realistic
`typicalAmount`, and an icon.

---

## 6. Categorization backend (the genuine service)

Build/extend a **categorization service** (Firestore-backed):

- On a new transaction, look up the merchant, copy its `tags[]` + `category` onto the
  transaction (denormalised), and write it to the `transactions` collection.
- A **DNA computation** method reads all of a user's transactions + the merchant
  catalogue and produces a `UserDNA`:
  - `categoryBreakdown` (amount + %, matching the existing breakdown UI).
  - `affinityVector`: for every tag, compute a normalised `weight` blending
    **frequency**, **recency** (more recent = higher), and **spend share**. Suggested:
    `weight = normalise( 0.5*freqShare + 0.3*recencyScore + 0.2*spendShare )`.
    Document the formula in code comments.
  - `topMerchants`.
  - `personas` (see §8).
- Expose `getUserDNA()` (live/observable) and `exportDnaJson()` (see §7).
- This must update **reactively**: after a payment in §5/Pay flow, the DNA page +
  breakdown reflect the new transaction without a manual refresh.

---

## 7. JSON export boundary for Eron (do my half only)

Eron consumes the DNA as JSON and does the **matching + location** himself.

- Implement `exportDnaJson(): string` returning the `affinityVector` **plus** the shared
  `merchants` catalogue (id + tags), so Eron can score merchant similarity on his side.
- **Do not** compute similarity scores, recommendations, or anything location-based here.
- Provide a tiny dev affordance (e.g. a button on Settings or a console method) to dump /
  copy this JSON so Eron can grab it.

Shape:
```json
{
  "userId": "...",
  "affinityVector": [{ "tag": "fnb:bubbletea", "weight": 0.82, "count": 14, "totalSpend": 89.6 }],
  "merchants": [{ "id": "gongcha", "tags": ["fnb:bubbletea","fnb:drinks"] }]
}
```

---

## 8. Concierge Wrapped — on-demand, swipeable story cards

A Spotify-Wrapped-style experience launched **on demand** from a button on the DNA page.

- **Format:** full-screen **swipeable story cards** (tap/swipe to advance, progress bar
  at top, NETS-branded). Build as an Ionic modal or dedicated route.
- **Identity axis = category-identity** (not behavioural yet). Derive `Persona`s from the
  affinity vector, e.g. **"Bubble Tea Royalty 🧋"**, **"Hawker Regular 🍜"**,
  **"Cinema Hopper 🎬"**, **"Cafe Dweller ☕"**, **"Fitness Junkie 💪"**. Map the top tags
  to a small library of named personas with copy + emoji + colour.
- Suggested card sequence: intro → total spent / # txns → top category → top merchant →
  signature drink/cuisine → your persona reveal → a shareable summary card.
- Leave a `// FUTURE:` hook for **behavioural** personas (Decision-Maker, Loyal Customer,
  Actively Buying) so it can be layered on later — design the persona system to allow it.

---

## 9. Pay tab — simulated NETS payment (no QR), no loopholes

A simulated "click and pay" flow styled like a NETS pay screen.

Flow: **pick merchant → confirm/enter amount → Pay → success → transaction written →
DNA updates live.**

Guard every edge case ("no loopholes"):
- Reject empty / zero / negative / non-numeric amounts; cap absurd values.
- Require a merchant selection before Pay is enabled.
- Prevent double-submit (disable button + in-flight guard) so one tap = one transaction.
- Handle the Firestore write failing (toast + no phantom transaction).
- Round to 2 dp; store as a number, not a string.
- Show a clear success state, then route back so the DNA reflects the new spend.

---

## 10. Seed data (so the demo looks alive)

- Seed the `merchants` collection from §5.
- Generate a **realistic simulated transaction history** for the demo user (e.g. ~60–80
  transactions over the past few months) with believable patterns — a bubble-tea habit,
  weekday lunches, weekend cinema, a gym streak, occasional shopping — so the DNA,
  breakdown, streaks, and Wrapped all look populated and interesting.
- Provide a dev-only **"Seed demo data"** button (Settings page) that idempotently writes
  merchants + the transaction history. Make it safe to re-run.
- Keep totals roughly consistent with the existing header style ($ spent / income /
  txns).

---

## 11. Theming — white, NETS-branded, MY PAGES ONLY

Re-theme **only** DNA, Pay, Settings, and the Wrapped — **never** Eron's pages.
Prefer page-scoped styles / a CSS class wrapper over editing global `variables.scss`
in a way that bleeds into Calendar/Explore. If you must add tokens globally, add **new**
NETS tokens without overriding the ones his pages use.

Official NETS palette (verified from NETS brand assets):

| Token | Hex | Use |
|---|---|---|
| NETS Red | `#EA0029` | accents, highlights, streaks, primary CTA option |
| NETS Midnight Blue | `#011835` | headers, primary text, dark surfaces |
| NETS Accent Blue | `#0057B8` *(derived)* | buttons, links, interactive — midnight is too dark for CTAs |
| Surface | `#FFFFFF` | page background (flip from current black → white) |
| Soft grey | `#F4F6F9` | card backgrounds / dividers |
| Muted text | `#5B6470` | secondary text |

- Move from the current **black** theme to a **clean white** NETS look on my pages.
- Replace the AI-generated "NETS" mark with the proper NETS wordmark treatment (Calvin
  to supply the real asset; until then use a styled text logo, **not** the AI image).
- Keep the existing "Detected Patterns" + "Category Breakdown" *concepts* but rebuild
  them clean: clear cards, NETS-blue progress bars, red for streaks/highlights, generous
  spacing, legible hierarchy. The DNA page should read like a **profile**: header
  (avatar + name + gear → Settings), persona chips, a "See your Wrapped" button,
  category breakdown, top merchants, affinity highlights.

---

## 12. Settings page

Simple page reachable from the DNA header gear: profile basics, the dev **"Seed demo
data"** button, an **"Export DNA JSON"** action (§7), and placeholders for real settings.
NETS white theme.

---

## 13. Build order — PAUSE after each step

1. **Read & report** (§0) — summary of existing model + plan. *Pause.*
2. Tag taxonomy + interfaces, extending `user-dna.service.ts` safely (§4). *Pause.*
3. Merchant catalogue + Firestore seed + "Seed demo data" button (§5, §10). *Pause.*
4. Categorization service + reactive DNA computation + affinity vector (§6). *Pause.*
5. Rebuild the **DNA page** (white NETS theme, profile layout) (§6, §11). *Pause.*
6. **Pay** tab — simulated payment writing a live transaction (§9). *Pause.*
7. **Concierge Wrapped** swipeable story cards (§8). *Pause.*
8. **Settings** + **Export DNA JSON** for Eron (§7, §12). *Pause.*
9. Polish pass: theming scoped check (confirm Eron's pages untouched), edge-case audit,
   responsive check.

At every step: keep changes scoped to my pages, preserve the shared model's public API,
and ask before anything that could affect Eron's code.

---

## 14. Definition of done

- DNA page rebuilt, white NETS theme, reads like a profile, shows breakdown + personas +
  a "See your Wrapped" entry point.
- Pay tab writes a real (simulated) transaction → categorized → DNA + breakdown update
  live, with all edge cases guarded.
- Wrapped runs on demand as swipeable story cards with category-identity personas.
- Settings page with Seed + Export JSON.
- `exportDnaJson()` outputs affinity vector + merchant tags for Eron; **no** similarity /
  recommendation / location logic written on my side.
- Calendar & Explore pages and their styling are **completely untouched.**