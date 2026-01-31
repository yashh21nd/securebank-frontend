# SecureBank Deployment Guide

## Project Structure

```
securebank-frontend/
├── src/                    # React Frontend
├── ml_model/               # Flask ML Backend
│   ├── fraud_api_server.py
│   ├── fraud_predictor.py
│   ├── requirements.txt
│   └── *.joblib (ML models)
└── dist/                   # Built frontend (after npm run build)
```

---

## 🚀 Deployment Options

### Option 1: Vercel (Frontend) + Render (Backend) - RECOMMENDED

#### Step 1: Deploy Backend to Render

1. **Create a GitHub repository** for the ml_model folder OR use a monorepo
2. Go to [render.com](https://render.com) and sign up
3. Click **"New +"** → **"Web Service"**
4. Connect your GitHub repository
5. Configure:
   - **Name:** `securebank-fraud-api`
   - **Root Directory:** `ml_model` (if monorepo)
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn fraud_api_server:app --bind 0.0.0.0:$PORT`
6. Click **"Create Web Service"**
7. Copy your deployed URL (e.g., `https://securebank-fraud-api.onrender.com`)

#### Step 2: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Configure Environment Variables:
   - `VITE_FRAUD_API_URL` = `https://securebank-fraud-api.onrender.com/api`
   - `VITE_API_URL` = `https://your-main-backend.onrender.com/api` (if you have one)
5. Click **"Deploy"**

---

### Option 2: Railway (Full Stack)

1. Go to [railway.app](https://railway.app)
2. Create new project
3. Deploy both services from same repo

---

### Option 3: Manual VPS Deployment

#### Backend (Ubuntu/Debian)

```bash
# Install Python
sudo apt update
sudo apt install python3 python3-pip python3-venv

# Clone repo
git clone <your-repo>
cd securebank-frontend/ml_model

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run with Gunicorn
gunicorn fraud_api_server:app --bind 0.0.0.0:5001 --workers 4
```

#### Frontend (Nginx)

```bash
# Build frontend locally
npm run build

# Upload dist/ folder to server
scp -r dist/* user@server:/var/www/securebank/

# Nginx config (/etc/nginx/sites-available/securebank)
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/securebank;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 🔧 Environment Variables

### Frontend (.env.production)
```
VITE_API_URL=https://your-backend.onrender.com/api
VITE_FRAUD_API_URL=https://your-fraud-api.onrender.com/api
VITE_WS_URL=wss://your-backend.onrender.com
```

### Backend
```
FLASK_ENV=production
PORT=5001
```

---

## 📁 Files Created for Deployment

- `vercel.json` - Vercel configuration
- `ml_model/render.yaml` - Render blueprint
- `ml_model/Procfile` - Heroku/Render process file
- `ml_model/runtime.txt` - Python version
- `.env.development` - Local dev environment
- `.env.production` - Production environment

---

## ⚠️ Important Notes

1. **ML Model Files**: The `.joblib` files (fraud_detection_model.joblib, scaler.joblib, etc.) must be included in your deployment. They're small enough for Git.

2. **Database**: The current setup uses SQLite locally. For production, consider:
   - PostgreSQL on Render/Railway
   - Or use the ML model without database features

3. **CORS**: Already configured to allow all origins. Restrict in production:
   ```python
   CORS(app, origins=["https://yourdomain.vercel.app"])
   ```

4. **Free Tier Limitations**:
   - Render: Spins down after 15min inactivity (first request slow)
   - Vercel: 100GB bandwidth/month

---

## 🧪 Quick Deploy Commands

```bash
# Frontend - Deploy to Vercel
npx vercel --prod

# Backend - Deploy to Render (via GitHub push)
git add .
git commit -m "Deploy to production"
git push origin main
```

---

## 🔗 After Deployment

1. Update `.env.production` with actual deployed URLs
2. Rebuild frontend: `npm run build`
3. Redeploy frontend to Vercel
4. Test all endpoints work correctly
