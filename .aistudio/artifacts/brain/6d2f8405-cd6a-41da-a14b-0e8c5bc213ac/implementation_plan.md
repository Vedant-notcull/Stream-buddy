# Streamer Buddy — Coin-Based Creator Support & Community Platform

A full-stack creator monetization and live-support platform connecting fans and streamers through coin wallets, animated supergifts, mini-Instagram stream moments, real-time OBS alerts, and structured payouts.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed through Phase 1 requirements review and will guide the build:

- **Confirmed Runtime Architecture**: Full-stack Node.js + Express with an in-memory transactional SQLite engine (`sql.js` / structured in-memory SQL database) serving a React 19 + Tailwind CSS single-page client.
- **Confirmed Starter Experience**: Persistent quick role-switcher allowing seamless 1-click toggling between Fan (Sam / Riya), Creator (Nova Plays / Pixel Pete), and Admin (Admin) with pre-seeded balances and activity.
- **Real-Time Stream Alerts & OBS Overlay**: Server-backed real-time alert dispatching with visual gift animations (Rose, Coffee, Trophy, Rocket), audio chime controls, and a dedicated transparent `/overlay` route built specifically for OBS / streaming software browser sources.
- **Atomic Financial Ledger**: Every coin transaction (welcome bonus, UPI/card purchase, gift send/receive, cashout payout, and voucher redemption) is recorded in an immutable ledger with atomic debit-credit balance derivation.

---

### 1. Overview & Core Concept

- **What It Does**: Streamer Buddy enables fans to recharge their coin wallet through multiple simulated Indian payment rails (UPI, Card with auto-detection, Net Banking), send customized Supercoins and tiered animated Supergifts to creators during streams, follow streamer feeds, and participate in paid community polls. Streamers showcase stream moments, monitor live earnings on an interactive dashboard, run OBS-ready alert overlays, and cash out funds via UPI or digital vouchers (Amazon, Swiggy, Steam). Admins govern platform rates, approve payout requests, and moderate user reports.
- **Target Audience / Persona**:
  - *Fans*: Viewers who want direct recognition from streamers, gamified gift combos, and community membership.
  - *Creators (Streamers)*: Content creators seeking a clean monetization hub, live visual stream overlays, and hassle-free earnings cashouts.
  - *Admins*: Platform operators monitoring fees, approving financial transfers, and enforcing safety standards.
- **Key Value**: Transparent, low-latency, friction-free creator support with clear auditability through ledger accounting, satisfying micro-interactions, and broadcast-ready tooling.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Fan Support & Social Engagement**:
   - Fan browses creator directory (Gaming, Music, Art) or trending stream cards.
   - Fan visits Creator Profile: views cover banner, bio, social handle chips (Instagram, YouTube, Twitch, X), photo moments grid, and pinned stream posts.
   - Fan clicks "Send Support": selects Supercoins (quick chips: 10, 50, 100, 500 or custom) or animated Supergift (Rose 10, Coffee 50, Trophy 500, Rocket 1000).
   - Fan sends gift: balance decrements with a coin-flight animation; repeat clicks build a live combo streak counter (x2, x3, x5!); creator instantly receives live alert.
   - If balance is low: quick wallet modal opens with coin packs (100, 500, 1000, 5000) and payment simulator (UPI, Card with live Luhn/brand validation, Net Banking).
2. **Creator Dashboard & OBS Stream Integration**:
   - Creator views 7-day earnings bar chart, available balance, estimated INR value (₹), and supporter count.
   - Live Alerts panel with sound toggle and "Send Test Alert" button.
   - Dedicated "OBS Browser Source" button opens a lightweight, transparent URL (`/overlay?creator=nova_plays`) with tiered visual gift popups (floating roses, rocket launch particle effects).
   - Creator manages posts, pins highlights, answers paid fan questions, and requests UPI cashouts or voucher codes.
3. **Weekly Wall of Fame**:
   - Leaderboard resets weekly (Monday reset indicator), spotlighting top 5 supporters with Gold, Silver, and Bronze medals.
   - Toggle ranking criteria: by total coins gifted or total gift count.
   - Anonymous fan display toggle ("Fan #104") and creator's pinned "Streamer's Choice" badge.
4. **Admin Moderation & Finance Console**:
   - Live KPI overview: total coins sold, total gifted, platform fee revenue, pending payouts.
   - Payout review queue: 1-click Approve (marks paid) or Reject (immediately refunds coins back to the creator's ledger).
   - Platform rate configuration: coin-to-rupee conversion rate and platform fee percentage.
   - Safety queue: flagged posts, comments, and reported user management.

#### Visual Identity & Theme
- **Aesthetic Direction**: Clean, contemporary creator-tech aesthetic with high whitespace discipline, single-elevation cards with hairline borders (`1px solid #e4e6ef` / `#262a37`), and zero visual clutter.
- **Color Palette**:
  - *Light Mode*: Canvas `#f5f6fa`, Surface `#ffffff`, Text `#14161f`, Muted `#6b7083`, Border `#e4e6ef`, Accent Violet `#6c4dff` (tint `#efeaff`), Coin Gold `#f0a91c`, Success `#12805c`, Danger `#d6393f`.
  - *Dark Mode*: Canvas `#0e1016`, Surface `#171a23`, Text `#eceef6`, Muted `#8f95aa`, Border `#262a37`, Accent `#8b73ff` (tint `#221d3d`), Coin Gold `#f5b73a`, Success `#3ccf9b`, Danger `#ff6b70`.
  - *Signature Coin*: Stylized coin token with inner gold ring and tabular coin counter (`font-mono tabular-nums`).
- **Typography & Hierarchy**:
  - Font family: `Manrope` (weights 500 to 800) with tight headline tracking (`tracking-tight`).
  - Monospace tabular figures (`tabular-nums`) for all monetary and coin balances.
  - Zero-pill metadata rule: clean unboxed metadata with subtle typographic separators (`·`).
- **Motion & Animations**:
  - Coin count-up transitions on wallet load and checkout.
  - Micro-particles on gift sends, full-screen celebratory bursts for Trophy (500) and Rocket (1000).
  - Smooth progress bar fills for stream community goals.
  - Full support for `prefers-reduced-motion` to disable non-essential motion.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Ledger-Based Accounting vs. Mutable Balance Column**
  - *Chosen Approach*: Immutable transaction ledger table (`ledger`). Current balances for fans and creators are computed via `SUM(amount)` grouped by user. Gift transactions atomically insert two ledger rows (fan `-amount`, creator `+amount`) within a single database transaction.
  - *Why*: Eliminates race conditions, double-spending, and discrepancy bugs; allows downloadable transaction receipts and complete financial auditing.
  - *Alternatives Considered*: Direct balance decrement/increment in user table (rejected due to vulnerability to concurrency issues and lack of audit trail).

- **Decision 2: Express Server with In-Memory SQLite & Embedded REST API**
  - *Chosen Approach*: Node.js Express server running an in-memory SQL database initialized with pre-seeded demo users, posts, and transactions. Vite serves the modern React 19 frontend seamlessly with API proxying.
  - *Why*: Meets the user's specification of SQL data persistence combined with Node.js and Tailwind, ensuring fast startup, reliable execution in AI Studio, and zero external database setup latency.

- **Decision 3: Broadcast Real-Time Alerts & OBS Overlay Architecture**
  - *Chosen Approach*: Server-authoritative event hub handling live alert dispatch for gifts, follows, and test events. A dedicated standalone overlay route `/overlay` renders a chroma/transparent background displaying animated alerts for OBS integration.
  - *Why*: Streamers can use the link directly in OBS or test it live inside the creator dashboard with instant audio feedback.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Streamer Buddy Client                           │
│  ┌───────────────────────────────┬──────────────────────────────────┐  │
│  │ Top Navigation Bar            │ Role Switcher (Fan/Creator/Admin)│  │
│  │ Brand · Nav Links · Coin Chip │ Light/Dark Theme · Sound Toggle  │  │
│  └───────────────────────────────┴──────────────────────────────────┘  │
│                                                                        │
│  ┌─────────────────────────┬──────────────────────┬─────────────────┐  │
│  │ Fan Experience          │ Creator Dashboard    │ Admin Console   │  │
│  │ - Creator Directory     │ - 7-Day Revenue Bar  │ - Payout Queue  │  │
│  │ - Mini-Instagram Feed   │ - Stream Highlights  │ - Rate Config   │  │
│  │ - Support Modal (Combos)│ - Live Alerts & OBS  │ - Safety/Reports│  │
│  │ - Coin Wallet & Packs   │ - UPI/Voucher Cashout│ - Global Stats  │  │
│  └─────────────────────────┴──────────────────────┴─────────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP REST & Event Stream
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Express Node.js Server                          │
│  ┌───────────────────────────────┬──────────────────────────────────┐  │
│  │ REST API Endpoints            │ Event Hub (Live Alerts Engine)   │  │
│  │ /api/auth, /api/wallet,       │ - Gift notifications             │  │
│  │ /api/creators, /api/posts,    │ - OBS overlay subscription       │  │
│  │ /api/payouts, /api/admin      │ - Test alert trigger             │  │
│  └───────────────────────────────┴──────────────────────────────────┘  │
│                                   │                                    │
│  ┌────────────────────────────────┴─────────────────────────────────┐  │
│  │ Transactional In-Memory SQLite Engine                            │  │
│  │ - users (fans, creators, admins)                                 │  │
│  │ - ledger (id, user_id, type, amount, counterparty_id, metadata)  │  │
│  │ - posts, comments, follows, stream_moments                       │  │
│  │ - payouts & vouchers, weekly_wall_of_fame, reports               │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

#### Data Entities & Ledger Schema
- `users`: `id`, `username`, `email`, `role` (`fan`, `creator`, `admin`), `avatar_url`, `cover_url`, `bio`, `social_handles`, `is_live`, `created_at`.
- `ledger`: `id`, `user_id`, `type` (`purchase`, `bonus`, `gift_sent`, `gift_received`, `payout`, `payout_refund`, `voucher`), `amount` (signed integer), `counterparty_id`, `description`, `receipt_code`, `created_at`.
- `posts`: `id`, `creator_id`, `content`, `image_url`, `is_pinned`, `likes_count`, `created_at`.
- `comments`: `id`, `post_id`, `user_id`, `content`, `badge_tier`, `created_at`.
- `stream_moments`: `id`, `creator_id`, `title`, `image_url`, `views_count`, `created_at`.
- `payout_requests`: `id`, `creator_id`, `type` (`upi`, `voucher`), `coins_amount`, `inr_amount`, `fee_deducted`, `destination`, `status` (`pending`, `paid`, `rejected`), `voucher_code`, `created_at`.
- `platform_settings`: `coin_to_inr_rate` (default ₹1 per coin), `fee_percent` (default 10%), `welcome_bonus` (100 coins).

#### Seeded Demo Data
- **Admin**: `admin@sb.com` / `admin123`
- **Creators**: `Nova Plays` (@novaplays, Gaming) & `Pixel Pete` (@pixelpete, Art/IRL)
- **Fans**: `Sam` (@sam_prime, 1500 coins starter) & `Riya` (@riya_vibes, 850 coins starter)
- **Initial Ledger**: Seeded with welcome bonuses, past purchases, and verified gift history for instant Wall of Fame and analytics rendering.
