# 🚌 Campus Bus Tracker

Real-Time College Bus Tracking & ETA Prediction System

## Stack
- Frontend: HTML, CSS, JavaScript, Leaflet.js + OpenStreetMap
- Backend: Node.js, Express.js
- Database: MySQL
- Realtime: Socket.io
- Auth: JWT + bcrypt

## Project Structure
```
CampusBusTracker/
├── frontend/          ← All HTML/CSS/JS pages
│   ├── index.html              Landing page
│   ├── login.html              Login (student/driver/admin)
│   ├── student-dashboard.html  Live map + ETA
│   ├── driver-dashboard.html   GPS sharing + trip control
│   ├── admin-dashboard.html    Full management panel
│   ├── css/style.css
│   └── js/api.js
├── backend/           ← Express API
│   ├── server.js
│   ├── config/db.js
│   ├── controllers/
│   ├── routes/
│   └── middleware/
└── database/
    └── campus_bus_tracker.sql
```

## Setup

### 1. Database
```sql
-- Run in MySQL Workbench or CLI
SOURCE database/campus_bus_tracker.sql;
```

### 2. Backend
```bash
cd backend
copy .env.example .env
# Edit .env with your MySQL credentials and a JWT secret
npm install
npm run dev
```

### 3. Frontend
Open `frontend/index.html` in a browser, or serve with Live Server.

### 4. Create admin account
After running the SQL, set admin password via:
```bash
node -e "const b=require('bcryptjs');b.hash('admin123',10).then(h=>console.log(h))"
# Copy the hash, then run in MySQL:
# UPDATE admins SET password='<hash>' WHERE username='admin';
```

## Default Credentials (after setup)
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@campus.edu | (set manually above) |
| Driver | (add via admin panel) | (set when creating) |
| Student | (register via app) | (set on register) |
