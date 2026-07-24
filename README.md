# ParkSmart — Smart Parking Assistant

Finding an available parking space during college events or peak hours is slow and causes
unnecessary congestion. **ParkSmart** helps drivers find and book available slots in real
time, and gives admins live capacity management, QR gate check-in/out, and analytics.

## Monorepo layout

```
ParkSmart/
├── backend/    Node.js + Express + Supabase (PostgreSQL) REST API   ✅ Stage 1 (done)
├── frontend/   React 19 + Vite + Tailwind + Framer Motion + Leaflet ✅ Stage 2 (done)
└── mobile/     Flutter app (same REST API, Android APK)             ✅ Stage 3 (done)
```

**Stack:** Express, Supabase (PostgreSQL), JWT + bcrypt, zod, helmet, express-rate-limit,
qrcode · React 19, Vite, Tailwind, React Router, Axios, React Leaflet, Framer Motion ·
Flutter.

---

## 1 · Database setup (Supabase)

1. Create a project at [supabase.com](https://supabase.com) (free tier is fine).
2. Open **SQL Editor** and run these four files **in order** (paste & run each):
   1. `backend/src/database/schema.sql` — tables + indexes
   2. `backend/src/database/triggers.sql` — `updated_at` touch + booking↔slot status sync
   3. `backend/src/database/rls_policies.sql` — Row Level Security (defense in depth)
   4. `backend/src/database/seed.sql` — 18 campus slots, demo accounts, booking history
3. Copy your credentials from **Project Settings → API**:
   Project URL, `anon` key, and `service_role` key.

### Demo accounts (created by seed.sql)

| Role     | Email                    | Password       |
| -------- | ------------------------ | -------------- |
| Admin    | `admin@parksmart.dev`    | `Admin@123`    |
| Operator | `operator@parksmart.dev` | `Operator@123` |
| User     | `user@parksmart.dev`     | `User@123`     |
| User     | `driver@parksmart.dev`   | `Driver@123`   |

---

## 2 · Backend

```bash
cd backend
cp .env.example .env    # then fill in the values below
npm install
npm run dev             # http://localhost:5000  (nodemon)
```

### Required `.env` variables (`backend/.env`)

| Variable                    | Purpose                                                        |
| --------------------------- | -------------------------------------------------------------- |
| `PORT`                      | API port (default `5000`)                                      |
| `NODE_ENV`                  | `development` / `production`                                   |
| `SUPABASE_URL`              | Project URL from Supabase settings                             |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key — **server-only**, bypasses RLS               |
| `SUPABASE_ANON_KEY`         | Public anon key                                                |
| `JWT_SECRET`                | ≥32-char random string for session tokens                      |
| `JWT_EXPIRES_IN`            | Token lifetime (default `7d`)                                  |
| `QR_SECRET`                 | Separate ≥32-char secret signing QR ticket payloads            |
| `CORS_ORIGIN`               | Comma-separated browser origin allow-list (never `*`)          |
| `RATE_LIMIT_*`              | Window/limits for auth & booking rate limiting                 |

### Quick smoke test

```bash
curl http://localhost:5000/api/v1/health
```

```bash
curl -X POST http://localhost:5000/api/v1/auth/login -H "Content-Type: application/json" -d "{\"email\":\"user@parksmart.dev\",\"password\":\"User@123\"}"
```

Then use the returned token: `Authorization: Bearer <token>`.

### API surface (all under `/api/v1`)

| Area          | Endpoints                                                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Auth          | `POST /auth/register` · `POST /auth/login` · `GET /auth/me` · `POST /auth/logout`                                            |
| Users         | `GET/PUT /users/profile` · `GET/POST /users/favorites` · `DELETE /users/favorites/:slotId`                                   |
| Parking       | `GET /parking/slots?status=&type=&zone=&search=` · `GET /parking/slots/:id` · `GET /parking/availability` (public) · `GET /parking/heatmap` (admin) |
| Bookings      | `POST /bookings/create` · `GET /bookings/my-bookings` · `GET /bookings/:id` · `POST /bookings/:id/cancel` · `POST /bookings/verify-qr` (admin/operator) |
| Admin         | `POST/PUT/DELETE /admin/slots[/:id]` · `GET /admin/users?search=`                                                            |
| Analytics     | `GET /analytics/summary` · `GET /analytics/peak-hours?days=7` (admin)                                                        |
| Notifications | `GET /notifications` · `POST /notifications` (admin broadcast) · `PATCH /notifications/:id/read` · `POST /feedback`          |

Every response uses the envelope `{ success, data, message }`.

**Booking flow:** `POST /bookings/create` validates the window, checks overlaps, then
atomically flips the slot `available → reserved` (conditional UPDATE — race-safe), creates
the booking `pending → confirmed`, and returns a signed **QR ticket** (base64 PNG in
`qr_code_url`). Gate staff scan it via `POST /bookings/verify-qr`: first scan checks in
(slot → occupied), second checks out (slot → freed) — a DB trigger keeps slot status in
lock-step with bookings.

---

## 3 · Frontend

```bash
cd frontend
npm install
npm run dev             # http://localhost:5173
```

`.env` needs one variable (already set for local dev): `VITE_API_URL=http://localhost:5000/api/v1`.

Or run **both** apps from the repo root: `npm install && npm run dev` (concurrently).

Highlights:

- **Liquid Glass design system** — frosted panels with gradient hairline borders and
  cursor-tracked ripple highlights, an animated mint/teal/volt blob mesh behind every page,
  dark theme by default with a light glass variant (persisted toggle).
- **Shared-layout motion** (Framer Motion `layoutId`): ParkingCard ⇄ Slot Details hero,
  Manage Slots grid cell ⇄ edit modal, QR thumbnail ⇄ fullscreen ticket, nav pill sliding
  between routes/tabs, morphing search bar; async buttons morph CTA → spinner → ✓.
- Pages: Landing, Login/Register, Dashboard (floating stat widgets + zone heat map +
  favorites quick-book), Live Map (react-leaflet, pulsing markers, filters, fly-in slot
  panel), Slot Details (walking distance via geolocation + haversine), Booking (live price
  preview + QR ticket), My Bookings, Profile, Admin Dashboard (broadcasts), Manage Slots,
  Admin Users, Analytics (recharts), About/Contact/404.
- `LazyMotion` + `MotionConfig` app-wide, `prefers-reduced-motion` respected, scroll
  position preserved on list pages.

## 4 · Mobile (Flutter)

A full Flutter client in `mobile/` that hits the **same `/api/v1` backend**, with the
same green "Liquid Glass" language (frosted `BackdropFilter` cards, drifting blob
background, Hero shared-element transitions).

```bash
cd mobile
flutter create --org com.parksmart --platforms=android,ios .   # generate native folders
flutter pub get
flutter run                                                     # Android emulator → http://10.0.2.2:5000
```

Release APK: `flutter build apk --release --dart-define=API_URL=https://YOUR_API_HOST/api/v1`.

Screens: Splash, Login/Register, Dashboard (floating stat tiles + zone heat map), Parking
Map (`flutter_map` + OpenStreetMap, status-coloured pins), Slot Details (walking distance
via geolocation + haversine), Book Slot (live price preview), My Bookings, **Active Ticket /
Wallet** (full-screen QR for the gate), Profile, Admin Dashboard, and a **QR Scanner**
(`mobile_scanner`) for operator/admin gate check-in/out. Local push notifications fire on
booking confirmation and 15 min before expiry. State via `provider`, networking via `dio`
through a shared `ApiService` that mirrors the web client (JWT injection + envelope
unwrapping).

Full setup, native permissions, and build details: [`mobile/README.md`](mobile/README.md).
