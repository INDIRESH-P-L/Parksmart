# 🚗 ParkSmart – Smart Campus Parking Assistant
### Sri Eshwar College of Engineering, Coimbatore

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-v19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v4.21-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Flutter](https://img.shields.io/badge/Flutter-v3.27+-02569B?logo=flutter&logoColor=white)](https://flutter.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?logo=vercel&logoColor=white)](https://vercel.com/)

---

## 📌 Overview

**ParkSmart** is an intelligent, real-time Smart Campus Parking System engineered specifically for **Sri Eshwar College of Engineering, Coimbatore** (`10.8267° N, 76.9942° E`).

Finding an available parking spot during campus hours, events, or peak timings is slow and creates unnecessary traffic bottlenecks. **ParkSmart** unifies web, mobile, and cloud infrastructure to deliver zero-search-time spot selection, live check-in/out tracking, interactive campus GIS mapping, and administrative CRUD governance.

---

## ✨ Core Features & Highlights

### 🚌 1. Bus-Style Interactive Seat Deck Selection
- **Bus Seat Layout**: Modeled after RedBus / AbhiBus interactive seat picking UI with **Lower Deck (Ground)** and **Upper Deck (Floor 1)** columns and driver steering wheel icon `☸️`.
- **Status Indicators**: Instant visual distinction between **Available** (lime green), **Occupied** (red vehicle), **Reserved** (yellow star), and **Selected Pick** (neon glow outline).
- **Slot Categories**: Standard 🚗, EV Charging ⚡, Accessible ♿, and VIP ⭐ slots across campus blocks (Mechanical, CSE & IT, Admin & Library, Auditorium, Sports Complex).

### 🟢 2. Real-Time Check-In & Check-Out System
- **Instant Actions**: One-click **Check In** when parking in a slot and **Check Out** when leaving.
- **Single Active Check-In Rule**: A user cannot check in to more than one slot simultaneously. If already checked in elsewhere, the system prompts:
  > *⚠️ You are currently checked in at slot SE-A02. Please check out before parking in a new slot.*
- **Strict Ownership Validation**: A user **cannot** check out another driver's slot (`occupied_by` verification enforced on server & UI).
- **Active Status Banner**: Logged-in users see a live top banner displaying their current parked spot with a quick one-tap **Check Out Now** action.

### 📍 3. Interactive Sri Eshwar Campus GIS Map
- **Leaflet & OpenStreetMap GIS**: Centered directly on Sri Eshwar College of Engineering, Coimbatore.
- **Landmark Pin**: Animated **`🏫 Sri Eshwar College`** campus marker with an interactive popup card displaying college address and campus hub badge.
- **Walking Distance Calculation**: Calculates walking time and distance from the parked spot to destination campus blocks.

### 🛡️ 4. Role-Based Access Control (RBAC) & Slot CRUD Manager
- **Admin-Only Slot CRUD**: The **Slot CRUD Manager** page (`/manage-slots`), slot creation/editing modals, and slot deletion controls are **strictly restricted to Admin logins**.
- **User View**: Standard users only access Dashboard, Bus Slot Selection, Live Map, and Profile. The "+ Add Parking Slot to Deck" button is hidden for non-admin users.

### 🗄️ 5. Supabase Cloud Database & Automatic Local Fallback
- **Supabase Cloud BaaS**: Connects to Supabase Cloud PostgreSQL (`https://klrhqelbthhihikwwbtt.supabase.co`).
- **Seamless Local Fallback**: Automatically falls back to an in-memory local dataset store (`localDb.js`) if remote cloud tables are not yet migrated, ensuring 100% uptime.

### 🚀 6. Optimized for Vercel Deployment
- Includes Vercel serverless function setup (`api/index.js`) and SPA rewrite routing (`vercel.json`) for seamless zero-config deployment.

---

## 🔑 Demo Credentials

| Role | Email / Username | Password | Accessible Features |
|---|---|---|---|
| 👑 **Admin** | `admin@ssece` | `admin@123` | Admin Console, Slot CRUD Manager, Analytics, User Management |
| 🛡️ **Admin (Alt)** | `admin@sece.ac.in` | `Admin@123` | Full Administrative Privileges |
| 👨‍✈️ **Operator** | `operator@sece.ac.in` | `Operator@123` | Gate Check-In/Out Audit & Monitoring |
| 🚗 **User** | `user@sece.ac.in` | `User@123` | Bus Seat Selection, Check-In/Out, Campus Map, Profile |

---

## 🛠️ Monorepo Directory Structure

```text
Parksmart/
├── api/                          # Vercel Serverless Entry Function
│   └── index.js
├── backend/                      # Node.js + Express REST API Server
│   ├── src/
│   │   ├── config/               # Supabase & Local Fallback Connection
│   │   │   ├── db.js
│   │   │   ├── localDb.js
│   │   │   └── supabase.js
│   │   ├── controllers/          # Parking, Auth & Admin Controllers
│   │   ├── middleware/           # Auth, RBAC & Validation Middleware
│   │   ├── models/               # ParkingSlot, User & Booking Models
│   │   ├── routes/               # Express API Endpoint Routes
│   │   └── services/             # Business Logic (Check-In/Out Rules)
│   ├── database/                 # PostgreSQL Schema & Seed Scripts
│   │   ├── schema.sql
│   │   ├── rls_policies.sql
│   │   └── seedSupabase.js
│   ├── package.json
│   └── server.js
├── frontend/                     # React 19 + Vite Web Application
│   ├── src/
│   │   ├── components/           # BusBookingSlotGrid, ParkingMap, GlassPanel
│   │   ├── context/              # Auth & Theme Context
│   │   ├── pages/                # SlotSelection, ParkingMap, ManageSlots
│   │   ├── routes/               # AppRoutes (Protected Admin Routes)
│   │   └── services/             # API Services
│   ├── package.json
│   ├── vercel.json
│   └── vite.config.js
├── mobile/                       # Flutter Cross-Platform Mobile Application
│   ├── lib/
│   │   ├── config/               # AppConfig (Sri Eshwar Coordinates)
│   │   ├── screens/              # Seat Picker, GIS Map, Profile
│   │   └── main.dart
│   └── pubspec.yaml
└── vercel.json                   # Root Vercel SPA Build Configuration
```

---

## 📡 API Endpoints Specification (`/api/v1`)

### 🅿️ Parking & Check-In/Out (`/api/v1/parking`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/parking/slots` | List all parking slots (supports filters & inactive) | Public |
| `GET` | `/parking/slots/:id` | Retrieve specific slot details | Public |
| `POST` | `/parking/slots/:id/check-in` | Check in to a parking slot (enforces 1 slot limit) | ✅ Yes |
| `POST` | `/parking/slots/:id/check-out` | Check out from a parking slot (enforces ownership) | ✅ Yes |
| `GET` | `/parking/availability` | Real-time zone-wise availability count | Public |
| `GET` | `/parking/heatmap` | Occupancy spatial heat map data | ✅ Admin Only |

### 🔑 Authentication (`/api/v1/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/auth/register` | Register new user account | Public |
| `POST` | `/auth/login` | Authenticate user & return JWT token | Public |
| `GET` | `/auth/me` | Fetch authenticated user profile | ✅ Yes |
| `POST` | `/auth/logout` | Revoke session token | ✅ Yes |

### ⚙️ Admin Governance (`/api/v1/admin`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/admin/slots` | Create a new parking slot | ✅ Admin Only |
| `PUT` | `/admin/slots/:id` | Update slot details or status | ✅ Admin Only |
| `DELETE`| `/admin/slots/:id` | Delete a parking slot | ✅ Admin Only |
| `GET` | `/admin/users` | List all registered campus users | ✅ Admin Only |

---

## 🚀 Local Installation & Running Guide

### 1️⃣ Prerequisites
- **Node.js**: v18.0 or higher
- **npm**: v9.0 or higher
- **Flutter SDK**: v3.27+ (optional for mobile app)

---

### 2️⃣ Start Backend Server
```bash
cd backend
npm install
npm run dev
```
*Backend API server will run at `http://localhost:5000/api/v1`.*

---

### 3️⃣ Start Frontend Web App
```bash
cd frontend
npm install
npm run dev
```
*Frontend dev server will run at `http://localhost:5173`.*

---

### 4️⃣ Mobile App (Flutter)
```bash
cd mobile
flutter pub get
flutter run --dart-define=API_URL=http://<YOUR_LOCAL_IP>:5000/api/v1
```

---

## 📜 License
Distributed under the **MIT License**. See `LICENSE` for details.

Developed with ❤️ for **Sri Eshwar College of Engineering, Coimbatore**.
