# Facebook Login Setup Guide

## The Problem
Facebook Login requires HTTPS. The error you saw:
```
The Login Button plugin no longer works on http pages. 
Please update your site to use https for Facebook Login.
```

## ✅ Solution 1: Use ngrok Tunnel (Easiest - Recommended for Testing)

### Step 1: Start the ngrok tunnel
```bash
# In terminal 1
cd D:\1.B.Groceries\Frontend\B-Frontend
npm run tunnel
```

This will output something like:
```
Tunnel URL: https://abc123.ngrok-free.app
```

### Step 2: Configure Facebook App
1. Go to [Facebook Developers Console](https://developers.facebook.com/apps/1352113810463033/)
2. Click **Settings** → **Basic**
3. Add to **App Domains**: `abc123.ngrok-free.app` (without https://)
4. Click **Save Changes**

5. Go to **Facebook Login** → **Settings** (left sidebar)
6. Add to **Valid OAuth Redirect URIs**:
   ```
   https://abc123.ngrok-free.app/
   https://abc123.ngrok-free.app/login
   https://abc123.ngrok-free.app/register
   ```
7. Click **Save Changes**

### Step 3: Update Backend CORS
The backend needs to allow your ngrok domain.

Edit `D:\1.B.Groceries\Backend\B-backend\src\main\java\com\bgroceries\backend\config\CorsConfig.java`:

Add your ngrok URL to allowed origins (temporarily for testing):
```java
.allowedOrigins("http://localhost:5173", "https://abc123.ngrok-free.app")
```

### Step 4: Test
1. Keep ngrok running
2. Start backend: `cd D:\1.B.Groceries\Backend\B-backend && mvn spring-boot:run`
3. Start frontend: `cd D:\1.B.Groceries\Frontend\B-Frontend && npm run dev`
4. Open **the ngrok URL** in your browser: `https://abc123.ngrok-free.app`
5. Go to Login or Register page
6. Click the Facebook button

**Note**: Free ngrok URLs change on restart, so you'll need to update Facebook settings each time.

---

## ✅ Solution 2: Local HTTPS with Self-Signed Certificate (Permanent Setup)

This creates a permanent HTTPS setup for localhost.

### Step 1: Install mkcert (one-time setup)

**Windows (with Chocolatey):**
```bash
choco install mkcert
```

**Or download manually:**
Go to https://github.com/FiloSottile/mkcert/releases and download `mkcert-v1.4.4-windows-amd64.exe`

### Step 2: Create local certificate
```bash
# Install local CA
mkcert -install

# Create certificate for localhost
cd D:\1.B.Groceries\Frontend\B-Frontend
mkcert localhost 127.0.0.1
```

This creates:
- `localhost+1-key.pem` (private key)
- `localhost+1.pem` (certificate)

### Step 3: Update vite.config.js
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    https: {
      key: fs.readFileSync('./localhost+1-key.pem'),
      cert: fs.readFileSync('./localhost+1.pem'),
    },
  },
})
```

### Step 4: Configure Facebook App
1. Go to [Facebook Developers Console](https://developers.facebook.com/apps/1352113810463033/)
2. Click **Settings** → **Basic**
3. Add to **App Domains**: `localhost`
4. Click **Save Changes**

5. Go to **Facebook Login** → **Settings**
6. Add to **Valid OAuth Redirect URIs**:
   ```
   https://localhost:5173/
   https://localhost:5173/login
   https://localhost:5173/register
   ```
7. Click **Save Changes**

### Step 5: Update Backend CORS
Edit `D:\1.B.Groceries\Backend\B-backend\src\main\java\com\bgroceries\backend\config\CorsConfig.java`:

```java
.allowedOrigins("http://localhost:5173", "https://localhost:5173")
```

### Step 6: Test
1. Start backend: `cd D:\1.B.Groceries\Backend\B-backend && mvn spring-boot:run`
2. Start frontend: `cd D:\1.B.Groceries\Frontend\B-Frontend && npm run dev`
3. Open `https://localhost:5173` (note: **https** not http)
4. Go to Login or Register page
5. Click the Facebook button

---

## 🎯 My Recommendation

**For quick testing now**: Use Solution 1 (ngrok)
**For permanent development**: Use Solution 2 (local HTTPS)

Both solutions work perfectly. ngrok is faster to set up but URLs change. Local HTTPS is permanent but requires initial setup.

---

## Troubleshooting

### Issue: "App Not Set Up" error from Facebook
- Make sure your Facebook app is in **Development mode**
- Add yourself as a **Test User** or **Developer** in Roles section
- Or switch app to **Live mode** (for production)

### Issue: CORS error
- Check that backend CORS includes your HTTPS origin
- Restart the backend after changing CORS config

### Issue: "Invalid OAuth Redirect URI"
- Double-check the URIs in Facebook Login settings
- Make sure they exactly match (including trailing slash or not)
- Facebook is case-sensitive

### Issue: Certificate warning in browser (Solution 2)
- This is normal for self-signed certificates
- Click "Advanced" → "Proceed to localhost"
- Or run `mkcert -install` again to trust the CA
