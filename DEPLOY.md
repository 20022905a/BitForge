# Deploy BitForge Live — Step by Step

## Step 1 — Deploy Backend to Railway (free)

1. Go to https://railway.app and sign up with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your `bitforge` repository
4. Set the **Root Directory** to `server`
5. Railway will auto-detect Node.js and deploy

6. Go to **Variables** tab and add these:
```
MONGODB_URI=mongodb+srv://bitforgeuser:Adedamola224$@cluster0.hzfejq5.mongodb.net/bitforge?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=bitforge_super_secret_key_nobody_can_guess_this_2025
MOONPAY_API_KEY=pk_test_3MkNWpkfKRhBrh8n5UnAqihEacUr5T
MOONPAY_SECRET_KEY=sk_test_o91e3XvS6zKIIyPkNVI0jFRg3d6yKFF
NODE_ENV=production
PORT=3001
```

7. Go to **Settings** → **Networking** → **Generate Domain**
8. Copy your Railway URL — looks like: `https://bitforge-server.up.railway.app`

---

## Step 2 — Update Frontend to use live backend

In your `client/.env` file, change:
```
VITE_API_URL=https://YOUR-RAILWAY-URL.up.railway.app/api
```

---

## Step 3 — Deploy Frontend to Vercel (free)

1. Go to https://vercel.com and sign up with GitHub
2. Click **"New Project"** → import your `bitforge` repo
3. Set **Root Directory** to `client`
4. Add environment variable:
   - Key: `VITE_API_URL`
   - Value: `https://your-railway-url.up.railway.app/api`
5. Click **Deploy**
6. Vercel gives you a URL like: `https://bitforge.vercel.app`

---

## Step 4 — Push latest code to GitHub

```bash
cd /Users/mac/Desktop/BitForge
git add .
git commit -m "Add 2FA, dark mode, news, charts, converter"
git push
```

Railway and Vercel will **automatically redeploy** every time you push to GitHub!

---

## Your live URLs will be:
- Frontend: https://bitforge.vercel.app
- Backend:  https://bitforge-server.up.railway.app
