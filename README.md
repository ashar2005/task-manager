# Task Manager App

A full-stack Task Manager built with React, Node.js, Express, and MongoDB.

## 🚀 Getting Started

### Prerequisites
- Node.js installed
- MongoDB Atlas account

### Installation

#### 1. Clone the repo
```bash
git clone https://github.com/ashar2005/task-manager.git
cd task-manager
```

#### 2. Setup Backend
```bash
npm install
```

Create a `.env` file in root folder:
PORT=5000
MONGO_URI=your_mongodb_connection_string
Run backend:
```bash
npm run dev
```

#### 3. Setup Frontend
```bash
cd client
npm install
npm start
```

### 🌐 Open in Browser
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`

## 📁 Project Structure
task-manager/
├── controllers/
├── models/
├── routes/
├── middleware/
├── server.js
└── client/         ← React frontend
## 🛠️ Built With
- React.js
- Node.js + Express
- MongoDB Atlas
- Tailwind CSS