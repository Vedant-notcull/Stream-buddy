# Streamer Buddy — Creator Support & Community Platform

A full-stack coin-based support and community platform for streamers, influencers, and viewers.

## 🌟 Key Features

1. **Transactional Coin Wallet & Immutable Ledger**:
   - Every coin movement (purchase, welcome bonus, gift sent, gift received, payout, voucher, refund) is recorded as an immutable row in the ledger.
   - Balances are computed from ledger rows with atomic debit-credit guarantees.
   - Downloadable and printable verification receipts for all transactions.

2. **Indian Payment Rails Simulator**:
   - Coin packs: 100, 500 (+25 bonus), 1000 (+80 bonus), 5000 (+500 bonus).
   - Three payment methods: UPI (Google Pay, PhonePe, Paytm, custom UPI ID), Credit/Debit Card (live Luhn check, card brand detection Visa/Mastercard/RuPay), and Net Banking (simulated bank authorization).
   - Structured for Razorpay test mode integration.

3. **Supercoins & Animated Supergifts**:
   - Supercoins: Quick-pick chips (10, 50, 100, 500) and custom amount.
   - Supergifts: Rose (10), Coffee (50), Trophy (500), Rocket (1000).
   - Combo streaks: Repeating gifts builds a live streak multiplier (x2, x3, x5!).
   - Full-screen celebratory canvas confetti for Trophy & Rocket.
   - Rate limiting (max 5 sends per 10s) and abusive word filter.

4. **Mini-Instagram Creator Profiles**:
   - Cover photo, avatar, "LIVE NOW" pulsing badge, bio, and follower count.
   - Social handle chips (Instagram, YouTube, Twitch, X).
   - Stream Moments photo grid with a full-screen lightbox viewer.
   - Stream feed posts with pinning, likes, and comment threads featuring Fan Level badges (Bronze, Silver, Gold, Diamond).

5. **Real-Time Live Alerts & Dedicated OBS Studio Overlay**:
   - In-app live pop-up toast alerts with tier-specific styles and Web Audio API synthesized chimes.
   - Dedicated transparent OBS overlay route at `/overlay?creatorId=...` for browser sources in OBS Studio.
   - Stream test alert triggers for all gift tiers.

6. **Weekly Wall of Fame**:
   - Top 5 supporters spotlighted with Gold, Silver, and Bronze medals.
   - Automatic Monday reset countdown.
   - Toggle ranking by "Total Coins Gifted" or "Number of Gifts".
   - "Streamer's Choice" pinned supporter of the week.

7. **Creator Studio & Cash Out**:
   - 7-day revenue bar chart and estimated ₹ INR valuation.
   - Direct UPI cashouts with live fee deduction previews (min 100 coins).
   - Instant digital gift voucher redemptions (Amazon India, Swiggy, Steam).
   - Payout status tracking (`pending`, `paid`, `rejected`).

8. **Admin Governance & Safety**:
   - Platform KPIs: total fans, creators, coins sold, coins gifted, fees earned.
   - Payout review queue: 1-click Approve or Reject (rejection automatically refunds coins back to the creator).
   - Edit platform fee % and coin-to-rupee conversion rate.

---

## 👥 Seeded Demo Accounts

Use the **One-Click Role Switcher** in the top navigation or log in with credentials:

| Role | Name | Email | Password | Starter State |
| :--- | :--- | :--- | :--- | :--- |
| **Fan** | Sam (@sam_prime) | `sam@sb.com` | `demo123` | Gold Fan · 1,500 coins starter balance |
| **Fan** | Riya (@riya_vibes) | `riya@sb.com` | `demo123` | Silver Fan · 850 coins starter balance |
| **Creator** | Nova Plays (@novaplays) | `nova@sb.com` | `demo123` | Gaming Streamer · Live Now · OBS Ready |
| **Creator** | Pixel Pete (@pixelpete) | `pete@sb.com` | `demo123` | Digital Artist · Live Now · Studio Q&A |
| **Admin** | System Admin (@admin) | `admin@sb.com` | `admin123` | Platform Rates, Payout Approvals & Moderation |

---

## 🚀 Running the App Locally

```bash
# 1. Install dependencies
npm install

# 2. Run dev server (Express + Vite)
npm run dev

# 3. Build for production
npm run build
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
To view the OBS overlay, open [http://localhost:3000/overlay?creatorId=usr_nova](http://localhost:3000/overlay?creatorId=usr_nova).
