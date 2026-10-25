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

## Connecting the Frontend to the Spring Boot Backend

The existing HTML, CSS, and JavaScript pages in `frontend/` are included in the Spring Boot application when Maven builds the backend. This keeps the current frontend and its design unchanged, while serving its pages and `/api` requests from the same origin.

1. Start MySQL. Set `SPRING_DATASOURCE_PASSWORD` in your environment, or keep your local-only password in `backend/application-local.properties` (this file is ignored by Git).
2. From the `backend` directory, run:
   ```bash
   mvn spring-boot:run
   ```
3. Open **http://localhost:8080/** (or **http://localhost:8080/login.html**) in your browser. Do not use VS Code Live Server for this integrated setup; opening the frontend from a separate server makes the relative `/api` URL point at the wrong server.

The frontend uses `/api` and the Spring Boot server exposes the student, warden, emergency, complaint, and dashboard endpoints. Demo warden credentials, when the database is first initialized, are `admin@hostel.edu` / `admin123`; demo student credentials are `STU101` / `password123` and `STU102` / `password123`.

## Deploying a Demo with Railway

The root `Dockerfile` builds the Spring Boot application and packages the existing `frontend/` pages. Railway can run this container alongside a Railway MySQL service.

1. Push the latest project files, including the root `Dockerfile`, `.dockerignore`, the backend production configuration, and the `frontend/` and `backend/` changes, to the GitHub repository connected to Railway. Do not upload `.env` files or passwords.
2. In Railway, create a project from that GitHub repository and add a MySQL service.
3. In the application service, set `SPRING_PROFILES_ACTIVE=production` and add references to the MySQL service variables `MYSQLHOST`, `MYSQLPORT`, `MYSQLDATABASE`, `MYSQLUSER`, and `MYSQLPASSWORD`. The production profile reads these values from the environment.
4. Set `HOSTEL_ADMIN_USERNAME`, `HOSTEL_ADMIN_PASSWORD` (choose a new, unique password), and optionally `HOSTEL_ADMIN_NAME` in the application service variables. Do not use the local demo password on a public deployment.
5. Generate a public domain for the application service and open that URL. Railway may require a paid plan or usage charges; review its current pricing before deploying.

The production profile does not seed demo student/emergency/complaint records. Use synthetic test data only: this project is a student demo and its API is not hardened for real student personal or emergency data. A public URL is accessible on the internet.

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
