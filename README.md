# ParkSmart — Smart Parking Assistant

Finding an available parking space during college events or peak hours is slow and causes unnecessary congestion. **ParkSmart** helps drivers find and book available slots in real time for **Sri Eshwar College of Engineering, Coimbatore**, featuring a **RedBus-style interactive seat deck (Lower / Upper Deck)**, live **Check-In / Check-Out**, Supabase Cloud Database integration, and Vercel single-page application deployment.

## Monorepo layout

```
ParkSmart/
├── backend/    Node.js + Express + Supabase (PostgreSQL) REST API   ✅ Stage 1 (done)
├── frontend/   React 19 + Vite + Tailwind + Framer Motion + Leaflet ✅ Stage 2 (done)
└── mobile/     Flutter app (same REST API, Android APK)             ✅ Stage 3 (done)
```

**Stack:** Express, Supabase (PostgreSQL), JWT + bcrypt, zod, helmet, express-rate-limit · React 19, Vite, Tailwind, React Router, Axios, React Leaflet, Framer Motion · Flutter.

---

## 1 · Key Features & Additions

- **🚌 Bus-Style Seat Selection Layout:** Interactive seat deck modeled after RedBus / AbhiBus apps (Lower Deck / Upper Deck) for visual slot picking and management.
- **🟢 Instant Check-In & Check-Out:** Direct Check-In (`POST /api/v1/parking/slots/:id/check-in`) when parking and Check-Out (`POST /api/v1/parking/slots/:id/check-out`) when leaving.
- **⚡ Full Slot CRUD:** Create, Read, Update, Delete, Status Toggle, Check-In, and Check-Out.
- **📍 Sri Eshwar College Campus GIS:** Map centered on Sri Eshwar College of Engineering (`10.8267, 76.9942`) with walking distance estimates.
- **🗄️ Supabase Cloud & Local Fallback:** Connected to Supabase Cloud Database with automatic local DB fallback.
- **🚀 Vercel Deployment:** Configured with `vercel.json` for SPA route rewriting.

---

## 2 · Demo Accounts

| Role     | Email                 | Password       |
| -------- | --------------------- | -------------- |
| Admin    | `admin@sece.ac.in`    | `Admin@123`    |
| Operator | `operator@sece.ac.in` | `Operator@123` |
| User     | `user@sece.ac.in`     | `User@123`     |

---

## 3 · Backend Setup

```bash
cd backend
cp .env.example .env
npm install
npm run dev             # http://localhost:5000
```

---

## 4 · Frontend Setup (Vite / Vercel)

```bash
cd frontend
npm install
npm run dev             # http://localhost:5173
npm run build           # build dist output
```

Vercel configuration file (`vercel.json`) is included in both root and `frontend/` directories for SPA routing (`rewrite: /index.html`).

---

## 5 · Mobile (Flutter App & APK)

```bash
cd mobile
flutter pub get
flutter run --dart-define=API_URL=http://192.168.114.159:5000/api/v1
flutter build apk --release --dart-define=API_URL=http://192.168.114.159:5000/api/v1
```

