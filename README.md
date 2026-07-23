# 🚗 ParkSmart – Smart Parking Assistant

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-v19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v4.21-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Flutter](https://img.shields.io/badge/Flutter-v3.27+-02569B?logo=flutter&logoColor=white)](https://flutter.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Open Source](https://img.shields.io/badge/Open--Source-%E2%9D%A4-brightgreen)](https://github.com/)
[![Hackathon Project](https://img.shields.io/badge/Hackathon-Project-orange?logo=rocket)](https://github.com/)

---

## 📌 Project Overview

**ParkSmart** is a next-generation Smart Parking Assistant engineered for high-density environments such as college campuses, universities, shopping malls, hospitals, and corporate parks. 

Navigating congested parking structures leads to wasted time, increased fuel consumption, and heightened traffic bottlenecks. **ParkSmart** addresses these friction points by uniting web, mobile, and cloud infrastructure into a unified real-time parking management ecosystem.

### Key Value Propositions
* ⏱️ **Zero Search Time:** Instantly view live spot availability before arriving at the location.
* 📍 **Interactive Maps & Navigation:** Turn-by-turn guidance with walking distance estimates to final destinations.
* 🎟️ **Seamless Spot Reservations:** Guarantee a spot ahead of time with instant digital ticket generation and QR-code check-ins.
* 📊 **Smart Campus Governance:** Powerful administration dashboards with occupancy heat maps, revenue analytics, and slot management.
* 🌿 **Eco-Friendly Impact:** Decreases vehicle idling, carbon footprint, and traffic congestion.

---

## 🛠️ Tech Stack

ParkSmart leverages a modern, decoupled monorepo architecture built for high performance, reliability, and cross-platform flexibility:

### **Frontend (Web Dashboard & Portal)**
* **Framework:** [React 19](https://react.dev/) with [Vite](https://vitejs.dev/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Routing:** [React Router v7](https://reactrouter.com/)
* **State & HTTP:** Axios & Context API
* **Mapping & GIS:** [React Leaflet](https://react-leaflet.js.org/) + [OpenStreetMap](https://www.openstreetmap.org/)
* **Animations & UI:** [Framer Motion](https://www.framer.com/motion/) & [React Icons](https://react-icons.github.io/react-icons/)

### **Backend (REST API)**
* **Runtime:** Node.js (v20+)
* **Framework:** Express.js
* **Database Driver & BaaS:** Supabase JS Client (`@supabase/supabase-js`)
* **Security & Auth:** JSON Web Tokens (JWT) & `bcrypt` password hashing
* **Middleware & Environment:** `dotenv`, `cors`, `helmet`, `express-rate-limit`

### **Mobile App (Cross-Platform)**
* **Framework:** [Flutter](https://flutter.dev/) (Dart)
* **Platforms:** Android & iOS
* **State Management:** Provider / Riverpod
* **Maps & Location:** `flutter_map` + `geolocator`

### **Database & Infrastructure**
* **Database Engine:** Supabase PostgreSQL
* **Spatial Support:** PostGIS (Geospatial queries)
* **Auth Engine:** Supabase Auth / Custom JWT with Role-Based Access Control (RBAC)

---

## ✨ Features

The platform delivers specialized feature sets tuned for different user roles and environments:

### 👤 User Features
* **Live Parking Availability:** Real-time occupancy indicators (Available, Occupied, Reserved, Maintenance).
* **Slot Booking System:** Pre-book parking slots with custom start/end durations and instant confirmation.
* **Interactive Parking Maps:** View floor-wise layouts, zone indicators, and building proximity.
* **Walking Distance Calculator:** Calculates walking steps/minutes from the parked spot to main campus buildings.
* **Favorites & Quick Bookings:** Pin frequently used slots or parking zones for one-tap reservations.
* **Parking History:** Detailed history of past and active bookings with digital receipts.
* **Dark Mode Support:** Smooth visual experience with automatic system theme detection.

### 🛡️ Admin Features
* **Real-time Occupancy Dashboard:** Complete overview of total capacity, live vehicle count, and daily throughput.
* **Manage Parking Slots & Zones:** Dynamically create, block, edit, or reassign parking slots across zones.
* **Occupancy Heat Maps:** Visual analytics showing peak hours, popular zones, and utilization rates.
* **User & Booking Audit:** Search, filter, and modify reservations or view user check-in history.
* **System Analytics:** Exportable performance reports on turnover rates, peak hours, and peak congestion points.

### 📱 Mobile Features (Flutter App)
* **On-the-Go Spot Finder:** Location-aware spot discovery based on current GPS coordinates.
* **QR Code Check-In / Check-Out:** Scan QR codes at gate barriers for friction-free validation.
* **Push Notifications:** Instant alerts for booking expiration, reservation start, and gate clearance.
* **Turn-by-Turn In-Lot Navigation:** Guidance from lot entrance straight to the reserved spot.

### 🧠 Smart Features
* **Smart Zone Allocation:** Suggests optimal parking spots based on the user's destination building.
* **Real-Time Synchronized State:** Supabase Realtime WebSocket subscriptions keep all clients updated instantly.

---

## 🖥️ Screen Directory

| Screen | Description | User Role |
|---|---|---|
| 🏠 **Landing Page** | Product overview, features, campus map preview, and quick access. | Public |
| 📊 **Dashboard** | High-level metrics, active reservations, and quick navigation actions. | User / Admin |
| 🗺️ **Parking Map** | Interactive vector/leaflet map with real-time slot status & filter controls. | User / Admin |
| 📅 **Booking Screen** | Slot selector, duration picker, vehicle details, and digital ticket generation. | User |
| 📈 **Analytics Portal** | Graphical charts, turnover rates, peak hours, and revenue metrics. | Admin |
| 👤 **User Profile** | Personal information, registered vehicles, favorite spots, and booking history. | User |
| ⚙️ **Admin Dashboard** | Control center for campus configurations, slot updates, and user management. | Admin |
| 🔲 **Slot Manager** | Live grid interface to toggle slot states (Available/Blocked/Maintenance). | Admin |
| 📱 **Mobile App Screens** | GPS Finder, QR Pass, Active Ticket, Navigation, and Wallet. | User (Mobile) |

---

## 📁 Project Directory Structure

```text
parksmart/
├── .github/                      # GitHub Actions & CI/CD workflows
├── backend/                      # Node.js & Express API Server
│   ├── config/                   # Supabase & DB Connection Config
│   │   └── supabase.js
│   ├── controllers/              # Route Controllers & Logic
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── bookingController.js
│   │   └── parkingController.js
│   ├── middleware/               # Auth, RBAC, Rate Limiter & Validation
│   │   ├── authMiddleware.js
│   │   └── errorMiddleware.js
│   ├── routes/                   # Express API Endpoints
│   │   ├── admin.routes.js
│   │   ├── auth.routes.js
│   │   ├── booking.routes.js
│   │   └── parking.routes.js
│   ├── utils/                    # Helper Functions & QR Generators
│   ├── .env.example              # Backend Environment Schema
│   ├── package.json
│   └── server.js                 # API Entry Point
├── frontend/                     # React 19 + Vite Web Application
│   ├── public/                   # Static Assets & Icons
│   ├── src/
│   │   ├── assets/               # Branding Images & Styles
│   │   ├── components/           # Reusable UI Components
│   │   │   ├── common/           # Navbar, Footer, Modal, Loader
│   │   │   ├── dashboard/        # Stats Cards, Occupancy Widget
│   │   │   └── map/              # Leaflet Map, Slot Marker, Heatmap
│   │   ├── context/              # Auth & Realtime State Context
│   │   ├── hooks/                # Custom React Hooks (e.g. useRealtimeSlots)
│   │   ├── pages/                # Application Page Components
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── BookingPage.jsx
│   │   │   ├── LandingPage.jsx
│   │   │   ├── ParkingMap.jsx
│   │   │   └── UserProfile.jsx
│   │   ├── services/             # Axios API Services & Supabase Client
│   │   ├── styles/               # Global CSS & Tailwind Setup
│   │   ├── App.jsx               # Main App Routing Setup
│   │   └── main.jsx              # React DOM Mount Entry
│   ├── .env.example              # Frontend Environment Schema
│   ├── package.json
│   └── vite.config.js
├── mobile/                       # Flutter Mobile Application
│   ├── android/                  # Android Native Config
│   ├── ios/                      # iOS Native Config
│   ├── lib/
│   │   ├── core/                 # Constants, Themes & Utilities
│   │   ├── models/               # Data Models (Slot, Booking, User)
│   │   ├── providers/            # State Management (Riverpod / Provider)
│   │   ├── screens/              # App Screens (Home, Map, QR Scanner, Pass)
│   │   ├── services/             # API & Supabase Mobile Client Services
│   │   └── main.dart             # Flutter Entry Point
│   ├── pubspec.yaml              # Flutter Dependencies
│   └── README.md
├── database/                     # Supabase Migration & Schema Scripts
│   ├── schema.sql                # Table definitions & Foreign Keys
│   ├── rls_policies.sql          # Row Level Security Policies
│   └── triggers.sql              # Realtime & Auto-update Triggers
├── docker-compose.yml            # Local Development Orchestration
├── LICENSE
└── README.md                     # Root Documentation
```

---

## 🏗️ System Architecture

ParkSmart utilizes an event-driven API architecture with client-level real-time synchronization.

```mermaid
graph TD
    subgraph Clients["Client Layer"]
        A[React 19 Web App]
        B[Flutter Mobile App]
    end

    subgraph API["Application & API Layer"]
        C[Node.js + Express Backend]
        D[JWT Authentication & RBAC]
        E[Rate Limiter & Validation]
    end

    subgraph Service["Services & Integrations"]
        F[OpenStreetMap / Leaflet GIS]
        G[QR Engine / Ticket Service]
    end

    subgraph Database["Data Layer (Supabase PaaS)"]
        H[(Supabase PostgreSQL)]
        I[Supabase Realtime WebSockets]
        J[PostGIS Geospatial Engine]
    end

    A -->|REST API Requests| C
    B -->|REST API Requests| C
    C --> D
    D --> E
    E -->|Database Queries| H
    C -->|GIS Navigation Data| F
    C -->|Ticket Validation| G

    H --- J
    H -->|WebSocket Pushes| I
    I -.->|Live Slot Updates| A
    I -.->|Live Slot Updates| B
```

---

## 🗄️ Database Design

The relational database layer is powered by **Supabase PostgreSQL** with Row Level Security (RLS) policies.

### 📋 Tables Summary

1. **`users`**: Stores user authentication data, profile metadata, roles (`USER`, `ADMIN`, `OPERATOR`), and vehicle details.
2. **`parking_slots`**: Contains slot IDs, zone designation, spatial coordinates, slot type (Standard, EV, Disability, VIP), status, and pricing.
3. **`bookings`**: Stores reservation transactions, check-in/out timestamps, generated QR codes, total fee, and status (`PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`).
4. **`notifications`**: User alert history for booking updates, gate clearance, and reminders.
5. **`feedback`**: User reviews, ratings, and parking experience feedback for campus administrators.

### 📐 Entity Relationship (ER) Diagram

```mermaid
erDiagram
    users ||--o{ bookings : "places"
    users ||--o{ notifications : "receives"
    users ||--o{ feedback : "submits"
    parking_slots ||--o{ bookings : "reserved_in"
    parking_slots ||--o{ feedback : "reviewed_for"

    users {
        uuid id PK
        string email
        string password_hash
        string full_name
        string role
        string phone_number
        string vehicle_number
        timestamp created_at
    }

    parking_slots {
        uuid id PK
        string slot_number
        string zone_name
        string floor_level
        string slot_type
        string status
        decimal hourly_rate
        decimal latitude
        decimal longitude
        boolean is_active
    }

    bookings {
        uuid id PK
        uuid user_id FK
        uuid slot_id FK
        timestamp start_time
        timestamp end_time
        timestamp check_in_time
        timestamp check_out_time
        decimal total_price
        string booking_status
        string qr_code_url
        timestamp created_at
    }

    notifications {
        uuid id PK
        uuid user_id FK
        string title
        string message
        boolean is_read
        timestamp created_at
    }

    feedback {
        uuid id PK
        uuid user_id FK
        uuid slot_id FK
        int rating
        string comments
        timestamp created_at
    }
```

---

## 📡 API Endpoints Specification

All API endpoints are prefixed with `/api/v1`.

### 🔑 Authentication (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required | Access |
|---|---|---|---|---|
| `POST` | `/auth/register` | Register a new user account | ❌ No | Public |
| `POST` | `/auth/login` | Authenticate user & return JWT token | ❌ No | Public |
| `GET` | `/auth/me` | Retrieve current authenticated user profile | ✅ Yes | User / Admin |
| `POST` | `/auth/logout` | Invalidate token session | ✅ Yes | User / Admin |

### 👤 Users (`/api/v1/users`)

| Method | Endpoint | Description | Auth Required | Access |
|---|---|---|---|---|
| `GET` | `/users/profile` | Get logged-in user profile details | ✅ Yes | User / Admin |
| `PUT` | `/users/profile` | Update user metadata & vehicle plate info | ✅ Yes | User / Admin |
| `GET` | `/users/favorites` | Fetch saved favorite parking slots | ✅ Yes | User |
| `POST` | `/users/favorites` | Save a parking slot to favorites | ✅ Yes | User |

### 🅿️ Parking Slots (`/api/v1/parking`)

| Method | Endpoint | Description | Auth Required | Access |
|---|---|---|---|---|
| `GET` | `/parking/slots` | Retrieve all parking slots with optional filters | ❌ No | Public |
| `GET` | `/parking/slots/:id` | Fetch specific slot details & location | ❌ No | Public |
| `GET` | `/parking/availability` | Real-time zone-wise slot occupancy count | ❌ No | Public |
| `GET` | `/parking/heatmap` | Occupancy spatial data for analytics overlay | ✅ Yes | Admin |

### 📅 Bookings (`/api/v1/bookings`)

| Method | Endpoint | Description | Auth Required | Access |
|---|---|---|---|---|
| `POST` | `/bookings/create` | Create a new slot reservation | ✅ Yes | User |
| `GET` | `/bookings/my-bookings` | Fetch user's booking history & active passes | ✅ Yes | User |
| `GET` | `/bookings/:id` | Retrieve specific booking ticket with QR code | ✅ Yes | User / Admin |
| `POST` | `/bookings/:id/cancel` | Cancel an active reservation | ✅ Yes | User / Admin |
| `POST` | `/bookings/verify-qr` | Scan & validate QR code at entry/exit gates | ✅ Yes | Admin / Gate Operator |

### ⚙️ Admin (`/api/v1/admin`)

| Method | Endpoint | Description | Auth Required | Access |
|---|---|---|---|---|
| `POST` | `/admin/slots` | Add a new parking slot to the system | ✅ Yes | Admin |
| `PUT` | `/admin/slots/:id` | Update slot details or status (Maintenance/Block) | ✅ Yes | Admin |
| `DELETE`| `/admin/slots/:id` | Delete a parking slot | ✅ Yes | Admin |
| `GET` | `/admin/users` | List all registered users | ✅ Yes | Admin |

### 📊 Analytics (`/api/v1/analytics`)

| Method | Endpoint | Description | Auth Required | Access |
|---|---|---|---|---|
| `GET` | `/analytics/summary` | Overall capacity, revenue, and usage stats | ✅ Yes | Admin |
| `GET` | `/analytics/peak-hours` | Hourly traffic density distribution | ✅ Yes | Admin |

---

## ⚡ Installation & Setup Guide

### Prerequisites
* **Node.js** (v20.0.0 or higher)
* **npm** (v9.0.0 or higher)
* **Flutter SDK** (v3.27.0 or higher) & Android Studio / Xcode
* **Git**
* A free **Supabase** account ([supabase.com](https://supabase.com))

---

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/parksmart.git
cd parksmart
```

---

### 2️⃣ Database Setup (Supabase)

1. Create a new project in the [Supabase Dashboard](https://database.new).
2. Open the **SQL Editor** tab in Supabase.
3. Run the schema creation SQL scripts located in `database/schema.sql`.
4. Copy your **Supabase URL**, **Anon Key**, and **Database Connection String** from Project Settings > API.

---

### 3️⃣ Backend API Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment config file
cp .env.example .env
```

Configure your `backend/.env` file (see [Environment Variables](#-environment-variables)).

```bash
# Start backend in development mode
npm run dev
```

The API server will run on `http://localhost:5000`.

---

### 4️⃣ Frontend Web Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Create environment config file
cp .env.example .env
```

Configure your `frontend/.env` file.

```bash
# Start Vite development server
npm run dev
```

The Web UI will be available at `http://localhost:5173`.

---

### 5️⃣ Mobile App Setup (Flutter)

```bash
# Navigate to mobile app directory
cd ../mobile

# Get Flutter packages
flutter pub get

# Check attached devices / emulators
flutter devices

# Run on connected Android device or emulator
flutter run
```

---

## 🔐 Environment Variables

### **Backend (`backend/.env`)**
```env
PORT=5000
NODE_ENV=development

# Supabase Credentials
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
DATABASE_URL=postgresql://postgres:your_password@db.your-project-id.supabase.co:5432/postgres

# JWT Security
JWT_SECRET=super_secret_jwt_key_parksmart_2026
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

### **Frontend (`frontend/.env`)**
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_MAP_TILE_PROVIDER=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

---

## 🚀 Deployment Guide

### **Frontend Deployment (Vercel)**
1. Connect your GitHub repository to [Vercel](https://vercel.com).
2. Set the Root Directory to `frontend`.
3. Framework Preset: **Vite**.
4. Add environment variables (`VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
5. Click **Deploy**.

### **Backend Deployment (Render / Railway)**
1. Create a Web Service on [Render](https://render.com) or [Railway](https://railway.app).
2. Set Root Directory to `backend`.
3. Build Command: `npm install`.
4. Start Command: `npm start`.
5. Add all Backend `.env` variables under Environment Settings.

### **Mobile App Build (Flutter APK)**
```bash
cd mobile

# Build standalone Android APK
flutter build apk --release

# Output APK path:
# build/app/outputs/flutter-apk/app-release.apk
```

---

## 🖼️ App Screenshots

> *Note: Place screen visual assets under `docs/screenshots/`.*

| Landing Page | Interactive Parking Map |
| :---: | :---: |
| ![Landing Page](docs/screenshots/landing_page.png) | ![Parking Map](docs/screenshots/parking_map.png) |

| User Dashboard | Slot Booking & QR Ticket |
| :---: | :---: |
| ![Dashboard](docs/screenshots/dashboard.png) | ![Booking](docs/screenshots/booking.png) |

| Admin Analytics & Heatmap | Mobile App Experience |
| :---: | :---: |
| ![Analytics](docs/screenshots/analytics.png) | ![Mobile App](docs/screenshots/mobile_app.png) |

---

## 🔮 Future Enhancements & Roadmap

- [ ] **AI Slot Prediction:** Machine learning algorithms to forecast spot availability based on campus timetable and weather.
- [ ] **Computer Vision Parking Detection:** Overhead camera feed integration using OpenCV to detect spot occupancy automatically.
- [ ] **IoT Hardware Integration:** Ultrasonic / Magnetic ground sensor sync via MQTT protocol.
- [ ] **ANPR (Automatic Number Plate Recognition):** Automatic gate barrier opening upon recognizing registered license plates.
- [ ] **Voice Navigation Assist:** Hands-free voice prompts guiding drivers to available slots.
- [ ] **EV Charging Slot Management:** Dedicated booking and charger control for Electric Vehicles.
- [ ] **Payment Gateway Integration:** Integrated UPI, Credit Card, and Apple/Google Pay for automated tolling.
- [ ] **Multi-Campus Support:** Switch seamlessly between multiple university or hospital campus locations.
- [ ] **Offline Mode Sync:** Local caching on Flutter app for low-connectivity underground basements.

---

## 🔒 Security Infrastructure

ParkSmart adheres to strict security standards for user data protection and infrastructure defense:

* **JWT Authentication:** Signed HTTP-only token transmission with secure expiration policies.
* **Password Hashing:** Passwords hashed with `bcrypt` using 12 salt rounds before storage.
* **Protected Routes & RBAC:** Granular authorization middleware ensuring admins and standard users access appropriate scopes.
* **Database Row Level Security (RLS):** Supabase RLS policies enforce data isolation per user at the database engine level.
* **Input Validation & Sanitization:** Strict schema validation on API payloads using `joi` / `zod`.
* **Rate Limiting:** IP-based request throttling using `express-rate-limit` to prevent brute force attacks.
* **CORS Management:** Strict Origin header policies restricting API access to trusted domains.

---

## ⚡ Performance Optimizations

* **Code Splitting & Lazy Loading:** React components and route views dynamically imported with `React.lazy()` and `Suspense`.
* **WebSocket Efficiency:** Supabase Realtime subscriptions scope payload updates strictly to modified slot rows.
* **Asset Optimization:** SVGs, optimized map tile caching, and lightweight icon sets using `react-icons`.
* **Database Indexing:** Indexed foreign keys and spatial coordinate indices (`GIST` index) on `parking_slots`.
* **Reusable UI Component Design:** Modular Tailwind design system minimizes redundant CSS bundles.

---

## 📜 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more details.

---

## 🤝 Contributing & Community

Contributions are what make the open-source community an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

<p center>
Developed with ❤️ for Smart Campuses & Urban Mobility.
</p>
