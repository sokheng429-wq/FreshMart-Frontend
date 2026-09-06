# Cloudflare Pages Deployment Guide

This repository is fully configured and ready for deployment on **Cloudflare Pages**.

---

## What Has Been Configured

1. **SPA Client-Side Routing Rewrite (`public/_redirects`)**:
   - Contains `/* /index.html 200`.
   - Prevents 404 errors when users refresh or directly visit subpaths like `/products`, `/orders`, `/login`, or `/admin`.

2. **Asset Caching & Security Headers (`public/_headers`)**:
   - Vite hashed static assets (`/assets/*`) are cached for 1 year (`Cache-Control: public, max-age=31536000, immutable`).
   - `index.html` is configured with `max-age=0, must-revalidate` so new releases reflect immediately on user browsers.
   - Built-in security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`).

3. **Node Runtime Specification (`.nvmrc`)**:
   - Configured to `20` to guarantee Cloudflare Pages builds with Node.js 20+ (required by React 19 & Vite 8).

4. **Cloudflare Configuration (`wrangler.json`)**:
   - Pre-configured with project name `b-groceries-frontend` and output directory `dist`.

5. **Dynamic Environment Variables**:
   - `src/api/api.js` dynamically pulls `VITE_API_BASE_URL` and `VITE_BACKEND_URL`, falling back to `http://localhost:8081` in local development.
   - All OAuth redirects, image upload paths, and authentication requests adapt dynamically to your deployed backend URL.

---

## Deployment Options

### Option 1: Git-Connected Deployment via Cloudflare Dashboard (Recommended)

This is the easiest and most automated method. Every time you push to your Git repository (`main` branch), Cloudflare automatically builds and deploys your site with preview branches on Pull Requests.

1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. In the left sidebar, navigate to **Compute (Workers & Pages)** > **Pages**.
3. Click **Create a project** > **Connect to Git**.
4. Select your repository (`B-Frontend-main`).
5. Configure the build settings:
   - **Framework preset**: `Vite` (or `None`)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (leave empty if root)
6. Expand **Environment variables (advanced)** and add:
   - `NODE_VERSION`: `20`
   - `VITE_API_BASE_URL`: `https://your-backend-api-domain.com/api`
   - `VITE_BACKEND_URL`: `https://your-backend-api-domain.com`
   - `VITE_GOOGLE_CLIENT_ID`: `your-google-client-id.apps.googleusercontent.com` (optional if using Google Login)
   - `VITE_TELEGRAM_BOT_USERNAME`: `FreshMartBot` (or your bot username)
7. Click **Save and Deploy**.

Your app will be live at `https://b-groceries-frontend.pages.dev` (or your custom domain).

---

### Option 2: Direct CLI Deployment using Wrangler

If you prefer to deploy directly from your local terminal:

1. Log in to Cloudflare from your terminal:
   ```bash
   npx wrangler login
   ```
2. Build and deploy in one command:
   ```bash
   npm run deploy
   ```
   Or manually:
   ```bash
   npm run build
   npx wrangler pages deploy dist --project-name=b-groceries-frontend
   ```

---

## Local Preview with Cloudflare Emulation

To test the production build locally with Cloudflare Pages headers and redirects:

```bash
npm run build
npm run preview:cf
```

This will run a local Cloudflare Pages server (default: `http://localhost:8788`) mimicking the exact edge behavior.

---

## Backend & OAuth Checklist for Production

When your frontend is live on Cloudflare (e.g., `https://b-groceries-frontend.pages.dev` or `https://groceries.yourdomain.com`), complete these backend adjustments:

1. **Spring Boot CORS Configuration**:
   In `B-backend/src/main/resources/application.yml`, ensure your Cloudflare Pages domain is in allowed origins:
   ```yaml
   cors:
     allowed-origins:
       - "http://localhost:5173"
       - "https://b-groceries-frontend.pages.dev"
       - "https://your-custom-domain.com"
   ```

2. **Google Cloud OAuth Credentials**:
   In [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
   - Under **Authorized JavaScript origins**, add `https://b-groceries-frontend.pages.dev`.
   - Under **Authorized redirect URIs**, add `https://your-backend-api-domain.com/login/oauth2/code/google` and `https://b-groceries-frontend.pages.dev/oauth2/redirect`.

3. **Facebook Login / Telegram Login**:
   - Add your Cloudflare domain to Facebook Login Valid OAuth Redirect URIs.
   - For Telegram, link your bot domain to your live frontend URL.
