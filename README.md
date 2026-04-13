# BitTrust Capital — Full Stack Crypto Investment Platform
> School project · React + Node.js + MongoDB + MoonPay

---

## What's inside

```
bittrust/
├── server/               ← Node.js + Express backend
│   ├── index.js          ← Entry point
│   ├── models/User.js    ← MongoDB user schema
│   ├── middleware/auth.js ← JWT protection
│   ├── routes/
│   │   ├── auth.js       ← Register, login, /me
│   │   ├── user.js       ← Profile, holdings, transactions
│   │   ├── prices.js     ← Live prices via CoinGecko
│   │   ├── moonpay.js    ← MoonPay URL signing + webhook
│   │   └── portfolio.js  ← Portfolio value calculator
│   └── .env.example
│
└── client/               ← React + Vite frontend
    ├── src/
    │   ├── pages/        ← Landing, Login, Register, Dashboard,
    │   │                    Markets, Portfolio, BuyCrypto,
    │   │                    Transactions, Settings
    │   ├── components/   ← Sidebar
    │   ├── context/      ← AuthContext (global user state)
    │   └── hooks/        ← useApi.js (axios + JWT auto-attach)
    └── index.html        ← MoonPay SDK script loaded here
```

---

## Step 1 — Install prerequisites

You need:
- **Node.js** v18 or higher → https://nodejs.org
- **VS Code** (you already have this)
- A free **MongoDB Atlas** account → https://cloud.mongodb.com
- A free **MoonPay** developer account → https://dashboard.moonpay.com

---

## Step 2 — Set up MongoDB Atlas (free)

1. Go to https://cloud.mongodb.com and create a free account
2. Create a new **Project**, then a free **M0 Cluster**
3. Under **Database Access** → Add a new user (username + password)
4. Under **Network Access** → Add IP Address → click **Allow Access from Anywhere** (for dev)
5. Click **Connect** → **Drivers** → copy the connection string
   - It looks like: `mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/`

---

## Step 3 — Set up MoonPay (free sandbox)

1. Go to https://dashboard.moonpay.com and sign up for free
2. Go to **Developers** → **API Keys**
3. Copy your **Publishable key** (starts with `pk_test_...`)
4. Copy your **Secret key** (starts with `sk_test_...`)
5. Go to **Settings** → add `http://localhost:5173` to allowed domains

> **Important:** The `pk_test_...` / `sk_test_...` keys are sandbox keys.
> They let you do fake transactions without real money — perfect for school.

---

## Step 4 — Configure the backend

```bash
cd bittrust/server
cp .env.example .env
```

Open `.env` in VS Code and fill in:

```
MONGODB_URI=mongodb+srv://youruser:yourpassword@cluster0.xxxxx.mongodb.net/bittrust?retryWrites=true&w=majority
JWT_SECRET=any_long_random_string_like_this_abc123xyz456def789
MOONPAY_API_KEY=pk_test_YOUR_KEY_HERE
MOONPAY_SECRET_KEY=sk_test_YOUR_SECRET_HERE
```

---

## Step 5 — Install and run the backend

```bash
cd bittrust/server
npm install
npm run dev
```

You should see:
```
✅  MongoDB connected
🚀  Server running on http://localhost:5000
```

---

## Step 6 — Install and run the frontend

Open a **second terminal** window:

```bash
cd bittrust/client
npm install
npm run dev
```

You should see:
```
  VITE v5.x  ready in 300ms
  ➜  Local:   http://localhost:5173/
```

Open http://localhost:5173 in your browser. 🎉

---

## Step 7 — Test MoonPay in sandbox

When buying crypto, use this test card:
- **Card number:** `4000 0209 5159 5032`
- **Expiry:** Any future date (e.g. `12/26`)
- **CVC:** Any 3 digits (e.g. `123`)
- **Name:** Anything

---

## How the app works

### Authentication flow
1. User registers → password hashed with bcrypt → saved to MongoDB
2. Server returns a **JWT token** (valid 7 days)
3. Frontend stores token in `localStorage`
4. Every API request sends the token in `Authorization: Bearer <token>`

### MoonPay payment flow
1. User picks a coin + amount on `/buy`
2. Frontend calls `/api/moonpay/config` to get the public API key
3. MoonPay SDK builds a widget URL
4. Frontend sends that URL to `/api/moonpay/sign-url`
5. **Server signs it** with HMAC-SHA256 using the secret key (secret never leaves server)
6. Signed URL is returned to frontend and passed to MoonPay SDK
7. Widget opens in an overlay
8. When transaction completes, MoonPay calls `/api/moonpay/webhook`
9. Server updates the user's holdings in MongoDB

### Live prices
- Backend fetches from CoinGecko free API every 30 seconds
- In-memory cache avoids rate limits
- Frontend polls every 30 seconds

---

## Deploy to the internet (optional, for presentation)

### Backend → Railway (free)
1. Go to https://railway.app and sign up
2. Click **New Project** → **Deploy from GitHub repo**
3. Push your `server/` folder to GitHub
4. Add your `.env` variables in Railway's **Variables** tab
5. Railway gives you a URL like `https://bittrust-server.up.railway.app`

### Frontend → Vercel (free)
1. Go to https://vercel.com and sign up
2. Click **New Project** → import your GitHub repo
3. Set root to `client/`
4. Add env variable: `VITE_API_URL=https://bittrust-server.up.railway.app/api`
5. Deploy → get a URL like `https://bittrust.vercel.app`

---

## Tech stack summary (for your project report)

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 18 + Vite | UI framework |
| Routing | React Router v6 | Page navigation |
| HTTP client | Axios | API calls |
| Styling | Pure CSS + CSS variables | Design system |
| Charts | Chart.js + react-chartjs-2 | Portfolio donut chart |
| Backend | Node.js + Express | REST API server |
| Database | MongoDB + Mongoose | User data, holdings, transactions |
| Auth | JWT + bcrypt | Secure login |
| Payments | MoonPay SDK | Fiat → Crypto on-ramp |
| Crypto data | CoinGecko API | Live market prices |
| Deployment | Vercel + Railway | Frontend + backend hosting |

---

Built as an educational project. Not financial advice.
