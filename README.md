# 🚨 Hostel Safety & Emergency Management System

A full-stack Web Application designed for university and college hostels to manage immediate crisis SOS alerts, resident safety complaints, and warden control room dispatch operations.

---

## 🏗️ Architecture & Technologies

- **Frontend**: Pure HTML5, CSS3 (Responsive Design), Vanilla JavaScript (ES6+ `fetch()` API)
  *(Pure web standard interface with zero bundle overhead, interactive modals, and real-time alerts)*
- **Backend**: Node.js, Express, TypeScript, BCrypt password hashing, Crypto secure sessions
- **Database**: MySQL 8.x / MariaDB (Relational schema with InnoDB, indexing, and connection pooling via `mysql2/promise`)
- **Build & Bundle**: Vite + esbuild (`npm run build` compiles frontend assets and bundles server to `dist/server.cjs`)
- **API Standard**: Secure JSON RESTful APIs with strict Role-Based Access Control (RBAC)

---

## 📂 Project Structure

```text
hostel-safety-management/
│
├── frontend/
│   ├── index.html               # Main Home & Emergency Portal
│   ├── emergency.html           # Emergency SOS Reporting Form
│   ├── complaint.html           # Safety Complaint Form
│   ├── login.html               # Student & Warden Login (Role-based)
│   ├── register.html            # Student Registration Page
│   ├── student-dashboard.html   # Student Dashboard (Status Tracking)
│   ├── admin-dashboard.html     # Warden Control Room (Metrics, Filters, Status Updates)
│   ├── css/
│   │   └── style.css            # Clean, modern college responsive CSS
│   └── js/
│       ├── api.js               # Central API configuration & session manager
│       ├── emergency.js         # Emergency dynamic alert box & REST submit
│       ├── complaint.js         # Safety complaint submission handler
│       ├── login.js             # Student and Warden authentication handler
│       ├── register.js          # Student registration handler
│       ├── student-dashboard.js # Emergency status table & metrics loader
│       └── admin.js             # Admin metrics, status updater & student directory
│
├── src/
│   └── db.ts                    # MySQL connection pool, schema verification & seed logic
├── server.ts                    # Full-Stack Express REST API & static server
├── schema.sql                   # MySQL relational schema (5 tables)
├── package.json                 # Scripts: dev, build, start, lint
├── .env.example                 # Environment variables specification
└── postman_collection.json      # Ready-to-import Postman API test collection
```

---

## 🚀 Commands & Production Workflow

### 1. Development Mode
```bash
npm run dev
# Starts backend server on port 3000 with tsx execution
```

### 2. Production Build
```bash
npm run build
# 1. Compiles frontend assets via Vite to dist/
# 2. Bundles server.ts via esbuild to dist/server.cjs
```

### 3. Production Start
```bash
npm start
# Runs compiled bundle: node dist/server.cjs
```

---

## 🗄️ MySQL Database Setup Instructions

1. Run the database migration script:
   ```bash
   mysql -u root -p < schema.sql
   ```
2. Or create the database and let the server auto-verify tables on startup:
   ```sql
   CREATE DATABASE IF NOT EXISTS hostel_safety_db;
   ```
3. Set your connection variables in `.env` (see `.env.example`).

---

## 🔗 Step 5: Connecting Frontend to Backend

In `frontend/js/api.js`, the default API base URL is set to `/api`. If you run the frontend independently on a different port (e.g. `http://127.0.0.1:5500`), change line 8 of `frontend/js/api.js`:
```javascript
const API_BASE_URL = "http://localhost:8080/api";
```
All form submissions will automatically use `fetch()` to call the Spring Boot REST API endpoints.

---

## 🧪 Step 6: Testing REST APIs with Postman

Import the included `postman_collection.json` file directly into Postman:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/students/register` | Register new resident student |
| `POST` | `/api/students/login` | Validate student login |
| `POST` | `/api/emergencies` | Report emergency (Sets initial status to `Pending`) |
| `GET` | `/api/emergencies` | Retrieve all emergencies |
| `GET` | `/api/emergencies/{id}` | Get emergency by ID |
| `PUT` | `/api/emergencies/{id}/status` | Admin updates status (`Pending` ➔ `In Progress` ➔ `Resolved`) |
| `POST` | `/api/complaints` | Submit safety maintenance complaint |
| `GET` | `/api/complaints` | Retrieve all safety complaints |
| `PUT` | `/api/complaints/{id}/status` | Update complaint status |
| `POST` | `/api/admin/login` | Warden / Admin authentication |
| `GET` | `/api/dashboard/stats` | Retrieve aggregated dashboard counts |

---

## 🛡️ Default Demo Credentials

- **Resident Student**:
  - Student ID: `STU101`
  - Password: `password123`
- **Warden / Admin**:
  - Username: `admin@hostel.edu`
  - Password: `admin123`
