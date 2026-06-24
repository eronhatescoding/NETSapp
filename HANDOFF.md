# NETS Consumer DNA — Calvin's Feature Handoff
> **PolyFintech Hackathon 2026 · Team VIB3RS**  
> This document covers everything Calvin built: the User DNA engine, Pay tab, Concierge Wrapped, and Settings. It explains every file, the Firestore database schema, the affinity algorithm, and exactly how Eron picks up from here for the recommendation / Explore side.

---

## Table of Contents
1. [What Was Built](#1-what-was-built)
2. [Tech Stack & Dependencies Added](#2-tech-stack--dependencies-added)
3. [Tab Structure](#3-tab-structure)
4. [Firestore Database Schema](#4-firestore-database-schema)
5. [Files — New](#5-files--new)
6. [Files — Modified](#6-files--modified)
7. [The DNA Algorithm Explained](#7-the-dna-algorithm-explained)
8. [Tag Taxonomy Reference](#8-tag-taxonomy-reference)
9. [Persona Library](#9-persona-library)
10. [For Eron: How to Consume the DNA](#10-for-eron-how-to-consume-the-dna)
11. [Demo Workflow (Step-by-step)](#11-demo-workflow-step-by-step)
12. [Ownership Boundaries](#12-ownership-boundaries)

---

## 1. What Was Built

Calvin's portion implements the full **Transaction → DNA → Wrapped** product loop:

```
User taps Pay tab
  → picks merchant → enters amount → confirms
  → Transaction written to Firestore (with merchant tags)
  → DNA service recomputes affinity vector automatically
  → DNA page updates live (category breakdown, personas, top merchants)
  → "See your Wrapped" shows a Spotify-style story summarising spending identity
  → Settings page lets you seed demo data + export the DNA JSON for Eron
```

---

## 2. Tech Stack & Dependencies Added

| Package | Version | Purpose |
|---|---|---|
| `firebase` | `^11.x` | Firebase SDK (Firestore) |
| `@angular/fire` | `^20.0.1` | Angular + Firebase integration (modular API) |

**Important:** The project uses **modular AngularFire** (`@angular/fire/app`, `@angular/fire/firestore`), NOT the compat layer (`@angular/fire/compat`). The compat layer was tried first but is incompatible with Angular v20's strict injection context rules (NG0203 error). Do not revert to compat imports.

**Firebase Project:** `nets-app-code-vib3rs`  
**Region:** `asia-southeast1`  
**Firestore Rules:** `allow read, write: if true` (open for demo)

---

## 3. Tab Structure

Bottom tab bar has **4 tabs**:

| Tab | Route | Icon | Owner |
|---|---|---|---|
| Calendar | `/tabs/calendar` | `calendar-clear-outline` | **Eron** |
| Explore | `/tabs/explore` | `compass-outline` | **Eron** |
| Pay | `/tabs/pay` | `card-outline` | **Calvin** |
| DNA | `/tabs/dna` | `person-circle-outline` | **Calvin** |

**Settings** is NOT a bottom tab. It is reached via the gear icon (⚙️) in the DNA page header → navigates to `/tabs/settings`.

---

## 4. Firestore Database Schema

### Collection: `transactions`
Every payment (real or seeded) lives here.

```
transactions/{autoId}
├── id          : string   — unique transaction ID
├── userId      : string   — always "demo_user_001" (no real auth)
├── date        : string   — "YYYY-MM-DD"
├── time        : string   — "HH:mm"
├── amount      : number   — SGD, rounded to 2dp, stored as number NOT string
├── type        : "debit" | "credit"
├── category    : string   — e.g. "Food & Beverage", "Shopping", "Fitness"
├── subcategory : string   — e.g. "Coffee", "Gym", "Bubble Tea"
├── description : string   — human-readable label
├── merchant    : string   — merchant display name
├── merchantId  : string   — matches merchant catalogue ID (e.g. "gong-cha")
├── tags        : string[] — namespaced tag array, e.g. ["fnb:bubbletea","fnb:drinks"]
└── paymentMethod: string  — "NETS Pay"
```

### Collection: `merchants`
Seeded once via Settings → Seed demo data. Eron can also read this collection.

```
merchants/{merchantId}
├── id           : string   — slug ID (e.g. "gong-cha", "activesg")
├── name         : string   — display name (e.g. "Gong Cha")
├── category     : string   — top-level category
├── tags         : string[] — all applicable tags
├── typicalAmount: number   — average spend in SGD
└── icon         : string   — Ionicon name (e.g. "cafe-outline")
```

### Collection: `_meta`
Internal sentinel used by the seed service to track whether seeding has occurred.

```
_meta/seeded
└── at: string — ISO timestamp of last seed
```

**Demo user ID:** All transactions are written with `userId = "demo_user_001"`. There is no authentication — the app is locked to this single demo user for the hackathon.

---

## 5. Files — New

### `src/app/data/tag-taxonomy.ts`
Defines all tag string constants and the full **persona library**.

- **`TAGS`** — typed constants object so tags are never mistyped as raw strings across the codebase. Example: `TAGS.FNB.BUBBLETEA === 'fnb:bubbletea'`
- **`PERSONA_LIBRARY`** — array of 12 `Persona` objects. Each persona has: `id`, `name`, `emoji`, `description`, `color` (hex), `triggerTags[]`. The DNA engine matches the user's top affinity tags against `triggerTags` to derive which personas the user has earned.

Current personas: Bubble Tea Royalty 🧋, Hawker Regular 🍜, Cafe Dweller ☕, Cinema Hopper 🎬, Fitness Junkie 💪, Fashion Forward 🛍️, Tech Enthusiast 💻, Foodie Explorer 🍣, Night Owl 🦉, Bookworm 📚, Fast Food Fan 🍟, Grocery Guru 🛒

There is a `// FUTURE:` comment stub in `Persona` interface for adding **behavioural personas** (Decision-Maker, Loyal Customer, Actively Buying) as a second layer — design is forward-compatible.

---

### `src/app/data/merchant-catalogue.ts`
A typed catalogue of **55 Singapore Gen-Z/millennial merchants**, exported as:
- `MERCHANT_CATALOGUE` — `Merchant[]` array (for iteration)
- `MERCHANT_BY_ID` — `Map<string, Merchant>` (for O(1) lookup by ID)

Each merchant has `id`, `name`, `category`, `tags[]`, `typicalAmount`, `icon`.

Merchant IDs used as foreign keys in transactions (`merchantId` field) and in the DNA export for Eron.

Coverage: Bubble tea, Coffee, Fast food, Western/casual dining, Japanese, Korean, Local/hawker, Groceries, Fashion, Beauty, Electronics, Entertainment, Fitness, Transport, Education, Subscriptions/telco.

---

### `src/app/data/seed.service.ts`
Injectable service that populates Firestore with demo data for presentation.

**Key methods:**
- `seedIfEmpty()` — checks `_meta/seeded` sentinel; only seeds if not already done. Safe to call on app start.
- `forceSeed()` — always re-seeds regardless of sentinel. Called by the Settings button. **Deletes all existing `demo_user_001` transactions first** (including any live Pay tab transactions), then writes fresh merchant + transaction batches. Safe to call multiple times — no duplicates.

**Transaction generator** (`generateDemoTransactions`): deterministic, hash-based. Given the same date range it always produces the same transactions. Uses a `hash(string) → 0..99` function seeded on the date string so patterns are consistent across re-seeds:
- Morning coffee (Mon/Wed/Fri, 70% chance)
- Bubble tea (Tue/Thu, 65% chance)
- Weekday lunch (Mon–Fri, 75% chance)
- Gym (Tue/Thu + Saturday, 70–85% chance)
- Saturday groceries (alternating FairPrice / Sheng Siong)
- Saturday cinema (every 3rd week)
- Monthly Spotify + Netflix subscriptions
- Monthly allowance credit ($500)
- Date range: 2026-04-01 → 2026-06-24 (~83 transactions)

---

### `src/app/pages/pay/` (4 files)

**`pay.page.ts`** — implements a 4-phase state machine:
```
selecting → confirming → paying → success
```
- `selecting`: 3-column merchant grid with live search filter grouped by category
- `confirming`: merchant card + dollar amount input + Pay button
- `paying`: button shows spinner, all inputs disabled, Firestore write in progress
- `success`: receipt card with merchant / amount / time / method

**Edge cases guarded:**
- Rejects empty, zero, negative, non-numeric amounts
- Caps at $9,999
- Double-submit prevention: `isSubmitting` flag + `canPay` getter both checked before write
- Firestore write failure → toast + rolls back to `confirming` (no phantom transaction)
- Amount stored as `number` rounded to 2dp, never as string

**`pay.page.html`** — each phase is an `*ngIf` section (only one visible at a time).

**`pay.page.scss`** — white NETS theme, 3-column merchant grid, large amount input, red Pay CTA button (grey when disabled), green pulsing success ring.

**`pay-routing.module.ts` / `pay.module.ts`** — standard lazy-loaded NgModule wiring.

---

### `src/app/pages/wrapped/` (3 files)

**`wrapped.component.ts`** — Ionic modal component opened from the DNA page. Receives `UserDNA` as a `@Input()` via `componentProps`.

Card sequence (dynamically built — cards for empty data are skipped):
1. **Intro** — "Your 2026 Wrapped" on NETS midnight blue
2. **Spending** — total `$XXX` on NETS red
3. **Transaction count** — number on purple
4. **Top category** — emoji + name + spend % on amber (only if `categoryBreakdown.length > 0`)
5. **Top merchant** — name + visit count on NETS blue (only if `topMerchants.length > 0`)
6. **Top tag** — affinity tag name + % bar on teal (only if `affinityVector.length > 0`)
7. **Persona reveal** — emoji + name + description on persona's own color (only if `personas.length > 0`)
8. **Summary** — all stats + persona chips + Done button on dark blue

**Navigation:** tap right half → next, tap left half → back. Swipe left/right also works (50px threshold). Close button (×) always visible top-right. Progress bar segments at top (Instagram-style).

**`wrapped.component.html / .scss`** — full-screen CSS `translateX` slide animation between cards. Each card is always in the DOM; active card is at `translateX(0)`, left-side cards at `translateX(-100%)`, right-side at `translateX(100%)`.

The WrappedComponent is declared in `InsightsPageModule` (not a separate module) so `ModalController.create({ component: WrappedComponent })` can reference it.

---

### `src/app/pages/settings/` (4 files)

**`settings.page.ts`** — two key actions:

`seedData()`:
- Calls `seedService.forceSeed()`
- Shows spinner while running (prevents double-tap)
- Success toast: `"Seeded 55 merchants + 83 transactions"`
- Error logged to console with full detail

`exportDna()`:
- Calls `userDnaService.exportDnaJson()`
- Copies JSON string to clipboard via `navigator.clipboard.writeText()`
- Falls back to `console.log()` if clipboard is unavailable (HTTP context)

**`settings.page.html`** — profile card + Developer Tools section (Seed + Export) + App Settings placeholders (Notifications toggle, Privacy, Appearance) + About (version + team).

---

### `src/assets/nets-logo.png`
The official NETS logo PNG. Used in the DNA page header (left-aligned, 28px tall) and Pay page header (centred, 24px tall). Replaces the earlier plain text "NETS" wordmark.

---

## 6. Files — Modified

### `src/app/app.module.ts`
Switched Firebase from compat to modular API. This was required because `AngularFireModule` / `AngularFirestoreModule` (compat layer) call Angular's `inject()` function in async contexts, which Angular v20 forbids (NG0203 error).

```typescript
// Removed from imports[]:
AngularFireModule.initializeApp(environment.firebase)
AngularFirestoreModule

// Added to providers[]:
provideFirebaseApp(() => initializeApp(environment.firebase))
provideFirestore(() => getFirestore())
```

---

### `src/app/models/transaction.model.ts`
Eron's original interfaces (`Transaction`, `SpendingPattern`, `WeeklyPattern`, etc.) are **completely untouched**. Calvin's DNA types are appended below a clear comment block:

- `Category` — union type of all top-level spend categories
- `Merchant` — merchant catalogue shape
- `TagAffinity` — single tag's computed weight, count, spend, lastSeen
- `Persona` — identity card with triggerTags and FUTURE behavioural hook
- `UserDNA` — the full computed profile: totals, categoryBreakdown, topMerchants, affinityVector, personas

New fields on `Transaction` are **optional** (`tags?`, `merchantId?`, `userId?`) so Eron's existing hardcoded transactions still typecheck without modification.

---

### `src/app/data/user-dna.service.ts`
Eron's original sync methods are **completely untouched** (`getAllTransactions`, `detectPatterns`, `getWeeklyPattern`, `getSameDayComparison`, `getTransactionById`, `getMonthStats`, `getCategoryBreakdown`).

**Added:**
- `Firestore` injection (modular API)
- `private txnSubject: BehaviorSubject<Transaction[]>` — reactive transaction store
- `readonly transactions$` — observable stream
- `readonly dna$` — live UserDNA observable (recomputes on every transaction change via `map + shareReplay(1)`)
- `syncFromFirestore()` — `onSnapshot` listener on `transactions` collection filtered by `userId = demo_user_001`. When Firestore has data it replaces the in-memory hardcoded set. Has error handler so a Firestore permission error falls back to hardcoded data gracefully.
- `addTransaction(partial)` — writes a single transaction doc to Firestore; the listener auto-picks it up and pushes through `dna$`
- `getUserDNA()` — synchronous snapshot (used by Wrapped modal)
- `computeUserDNA()` — full DNA computation (see algorithm section below)
- `derivePersonas(affinityVector)` — matches top-20 affinity tags against persona library
- `exportDnaJson()` — Eron's handoff export (see Section 10)

---

### `src/app/pages/insights/insights.page.ts / .html / .scss`
Complete rebuild. The Insights page is now the **DNA page** — a profile-style layout showing:
- Avatar + name + persona chips
- Stats card ($ spent / $ income / txn count)
- Red "See your Wrapped" CTA button
- Category breakdown with progress bars
- Top merchants list
- Affinity highlights (top tags)
- Detected patterns (Eron's existing pattern data, kept but displayed compactly)

Theme: white NETS. Dark mode forced off with `--background: #FFFFFF` + `&::part(background) { background: #FFFFFF }` so OS dark mode doesn't bleed in.

---

### `src/app/pages/insights/insights.module.ts`
Added `WrappedComponent` to `declarations[]` and `ModalController` to the constructor (via `IonicModule` which is already imported).

---

### `src/app/tabs/tabs-routing.module.ts`
Added two new child routes: `pay` and `settings`.

---

### `src/app/tabs/tabs.page.html / .scss`
Rebuilt tab bar to 4 tabs: Calendar, Explore, Pay, DNA. The Pay tab previously had a FAB (elevated red circle) — this was replaced with a standard tab button identical in size/style to the others, turning NETS blue (`#0055A4`) when selected.

---

### `src/environments/environment.ts` / `environment.prod.ts`
Added Firebase config object (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`).

---

### `src/global.scss`
Added one class at the end:
```scss
.wrapped-modal {
  --height: 100%;
  --width: 100%;
  --border-radius: 0;
}
```
This makes the Wrapped modal full-screen. It is scoped by class name and does not affect any other Ionic component.

---

## 7. The DNA Algorithm Explained

The core of the product. Located in `UserDnaService.computeUserDNA()`.

### Step 1 — Split transactions
```
all transactions
  → debits  (type === 'debit' && amount > 0)  ← spending
  → credits (type === 'credit')                ← income
```

### Step 2 — Category breakdown
Sum spend per category → compute percentage of total spent → sort descending.

### Step 3 — Top merchants
Group debits by `merchantId` (or `merchant` name as fallback) → count visits and sum spend → sort by visit count descending → take top 10.

### Step 4 — Tag affinity vector (the core)

For every tagged transaction, split spend equally across its tags. Then for each unique tag:

```
freqShare     = tag.count / totalTagOccurrences
                (how often this tag appears vs all tags)

daysSince     = days between tag's lastSeen date and today

recencyScore  = e^(-0.05 × daysSince)
                (exponential decay; half-life ≈ 14 days)
                (a tag seen yesterday scores ~0.95; one seen 3 months ago scores ~0.01)

spendShare    = tag.totalSpend / totalTagSpend
                (what fraction of total tagged spend this tag represents)

rawScore      = 0.5 × freqShare + 0.3 × recencyScore + 0.2 × spendShare

weight        = rawScore / max(rawScore across all tags)
                (normalised to 0..1 so Eron always gets comparable values)
```

Weights are normalised so the top tag always has `weight = 1.0` and all others are relative to it.

The affinity vector is sorted descending by weight — `affinityVector[0]` is always the user's single strongest affinity.

### Step 5 — Personas
The top 20 tags from the affinity vector are collected into a Set. Each persona in `PERSONA_LIBRARY` has a `triggerTags[]` list. If any of the user's top-20 tags matches any of a persona's trigger tags, that persona is activated. Up to 3 personas are shown.

---

## 8. Tag Taxonomy Reference

Tags use `namespace:subtag` format. All constants are in `src/app/data/tag-taxonomy.ts`.

| Namespace | Subtags |
|---|---|
| `fnb:` | `bubbletea`, `coffee`, `breakfast`, `lunch`, `dinner`, `supper`, `brunch`, `fastfood`, `hawker`, `foodcourt`, `cafe`, `restaurant`, `japanese`, `korean`, `western`, `chinese`, `malay`, `juice` |
| `shopping:` | `fashion`, `beauty`, `electronics`, `groceries`, `convenience`, `lifestyle` |
| `ent:` | `cinema`, `arcade`, `ktv`, `gaming`, `liveevents`, `nightlife` |
| `fit:` | `gym`, `studio`, `sports`, `yoga`, `climbing` |
| `edu:` | `books`, `courses`, `stationery` |
| `trn:` | `ridehailing`, `transit`, `fuel` |
| `lst:` | `subscription`, `telco`, `wellness` |

---

## 9. Persona Library

| ID | Name | Emoji | Trigger Tags |
|---|---|---|---|
| `bubble-tea-royalty` | Bubble Tea Royalty | 🧋 | `fnb:bubbletea`, `fnb:drinks` |
| `hawker-regular` | Hawker Regular | 🍜 | `fnb:hawker`, `fnb:foodcourt`, `fnb:lunch` |
| `cafe-dweller` | Cafe Dweller | ☕ | `fnb:coffee`, `fnb:cafe`, `fnb:breakfast` |
| `cinema-hopper` | Cinema Hopper | 🎬 | `ent:cinema` |
| `fitness-junkie` | Fitness Junkie | 💪 | `fit:gym`, `fit:studio`, `fit:sports` |
| `fashion-forward` | Fashion Forward | 🛍️ | `shopping:fashion`, `shopping:lifestyle` |
| `tech-enthusiast` | Tech Enthusiast | 💻 | `shopping:electronics` |
| `foodie-explorer` | Foodie Explorer | 🍣 | `fnb:japanese`, `fnb:korean`, `fnb:western`, `fnb:restaurant` |
| `night-owl` | Night Owl | 🦉 | `ent:nightlife`, `ent:ktv`, `fnb:supper` |
| `bookworm` | Bookworm | 📚 | `edu:books`, `edu:courses`, `edu:stationery` |
| `fast-food-fan` | Fast Food Fan | 🍟 | `fnb:fastfood` |
| `grocery-guru` | Grocery Guru | 🛒 | `shopping:groceries`, `shopping:convenience` |

---

## 10. For Eron: How to Consume the DNA

### Getting the data

**Option A — Export button (for dev/demo):**
Settings page → "Export DNA JSON" → copies to clipboard. Paste into your code.

**Option B — Read directly from Firestore (production approach):**
The `transactions` and `merchants` collections are open (`if true` rules). You can query them directly from your own service using the same modular Firebase setup.

**Option C — Call `exportDnaJson()` programmatically:**
```typescript
// In your service, inject UserDnaService and call:
const json = this.userDnaService.exportDnaJson();
const data = JSON.parse(json);
// data.affinityVector — use this for matching
// data.merchants     — use this as the tag dictionary
```

### The JSON shape

```json
{
  "userId": "demo_user_001",
  "affinityVector": [
    { "tag": "fnb:bubbletea", "weight": 1.0,  "count": 18, "totalSpend": 112.40, "lastSeen": "2026-06-24" },
    { "tag": "fnb:coffee",    "weight": 0.78, "count": 14, "totalSpend": 38.50,  "lastSeen": "2026-06-24" },
    { "tag": "fit:gym",       "weight": 0.61, "count": 11, "totalSpend": 22.00,  "lastSeen": "2026-06-23" }
  ],
  "merchants": [
    { "id": "gong-cha",  "tags": ["fnb:bubbletea", "fnb:drinks"] },
    { "id": "starbucks", "tags": ["fnb:coffee", "fnb:cafe", "fnb:breakfast"] }
  ]
}
```

### How to build the recommendation score

For each candidate merchant (from `data.merchants`), score it:

```
score(merchant) = sum of affinityWeight for each tag the merchant shares with the user

e.g. Merchant "Gong Cha" has tags ["fnb:bubbletea", "fnb:drinks"]
     user.affinityVector has fnb:bubbletea at weight 1.0
     → score = 1.0  (high match → top recommendation)

e.g. Merchant "ActiveSG" has tags ["fit:gym", "fit:sports"]
     user has fit:gym at weight 0.61
     → score = 0.61
```

Filter out merchants the user visits frequently (already in `topMerchants`) to surface **new** recommendations. Apply your location filter on top of the scored list.

### What Calvin does NOT provide (Eron's responsibility)
- Merchant similarity / collaborative filtering
- Location/proximity filtering
- The actual recommendation cards on the Explore tab
- Any geolocation or map logic

---

## 11. Demo Workflow (Step-by-step)

For the live demo, run through this sequence:

1. **Open the app** — Calendar tab shows (Eron's page)
2. **Tap DNA tab** — shows profile with hardcoded transactions (no personas yet)
3. **Tap gear ⚙️** → Settings → **tap "Seed demo data"** — wait for success toast (~5–10 sec)
4. **Go back to DNA tab** — now shows: 3 persona chips, populated category breakdown, top merchants, affinity bars
5. **Tap "See your Wrapped"** — full-screen story cards with real data
6. **Swipe / tap through** all 8 cards (intro → spend → txns → category → merchant → tag → persona → summary)
7. **Tap Done** — back to DNA page
8. **Tap Pay tab** — pick a merchant (e.g. Gong Cha), confirm amount, tap Pay
9. **Watch DNA page** — total spend and transaction count update live (Firestore listener)
10. **Settings → Export DNA JSON** — clipboard copy for Eron handoff demo

---

## 12. Ownership Boundaries

| Area | Owner | Status |
|---|---|---|
| Calendar page | **Eron** | Do not touch |
| Explore / Events page | **Eron** | Do not touch |
| Recommendation & location logic | **Eron** | Not yet built (consumes affinityVector) |
| `user-dna.service.ts` (existing public methods) | **Shared** | Eron's methods preserved exactly |
| `transaction.model.ts` (original interfaces) | **Shared** | Eron's types preserved exactly |
| DNA page (`/tabs/dna`) | Calvin | Complete |
| Pay tab (`/tabs/pay`) | Calvin | Complete |
| Concierge Wrapped (modal) | Calvin | Complete |
| Settings page (`/tabs/settings`) | Calvin | Complete |
| Tag taxonomy + persona library | Calvin | Complete |
| Merchant catalogue (55 merchants) | Calvin | Complete |
| Seed service | Calvin | Complete |
| DNA affinity computation | Calvin | Complete |
| `exportDnaJson()` for Eron | Calvin | Complete — no similarity/location logic inside |

---

*Last updated: 2026-06-25 · Calvin · Team VIB3RS*
