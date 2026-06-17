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
├── frontend/          ← Deploy this folder (static hosting / Nginx / Netlify)
│   ├── index.html
│   ├── login.html
│   ├── student-dashboard.html
│   ├── driver-dashboard.html
│   ├── admin-dashboard.html
│   ├── css/style.css
│   └── js/api.js
├── backend/           ← Deploy this folder (Node.js server / Railway / Render)
│   ├── server.js
│   ├── database.sql   ← SQL schema + seed data (import this into MySQL)
│   ├── .env.example   ← Copy to .env and fill in your values
│   ├── config/db.js
│   ├── controllers/
│   ├── routes/
│   └── middleware/
└── database/
    └── campus_bus_tracker.sql  ← Same SQL file (source copy)
```

## Deployment

### 1. Database (MySQL)
Import the schema on your MySQL server:
```bash
mysql -u root -p < backend/database.sql
# or in MySQL Workbench: File > Run SQL Script > select backend/database.sql
```

### 2. Backend
```bash
cd backend
cp .env.example .env        # Windows: copy .env.example .env
# Edit .env — set DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET
npm install
npm start                   # Production
# or: npm run dev           # Development (nodemon)
```

The backend runs on **port 5000** by default.

### 3. Frontend
Point `API_BASE` in `frontend/js/api.js` to your deployed backend URL before deploying:
```js
const API_BASE = 'https://your-backend-url.com/api';
```
Then deploy the `frontend/` folder to any static host (Netlify, Vercel, Nginx, etc.).

For local dev, serve with:
```bash
cd frontend
npx serve . -p 3000
```

### 4. Environment Variables (backend/.env)
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=campus_bus_tracker
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d
```

## Default Credentials
| Role    | Email               | Password  |
|---------|---------------------|-----------|
| Admin   | admin@campus.edu    | admin123  |
| Driver  | (add via admin panel) | set on create |
| Student | (register via app)  | set on register |
