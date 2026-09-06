# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

B'Groceries Frontend — a bilingual (English/Khmer) e-commerce grocery platform built with:
- React 19
- React Router 7  
- Vite 8 (dev server on port 5173 - critical for OAuth redirects)
- Tailwind CSS 4

It connects to a Spring Boot backend (`B-backend` repo) running on `http://localhost:8081/api` (CORS is open).

**Theme colors:** Primary Orange `#FF9900`, Primary Green `#77BC1F`, Dark Background `#0B0F14`, Secondary Dark `#232F3F`

## Quick Start

```bash
npm install              # Install dependencies
npm run dev              # Start Vite dev server (http://localhost:5173)
npm run build            # Production build to dist/
npm run preview          # Preview production build locally
npm run lint             # Run ESLint
npm run tunnel           # ngrok tunnel for OAuth testing
```

No test framework is configured; verify changes manually via the dev server.

## Architecture

### Context Providers (nested in main.jsx)

Five global providers wrap the app in this order: **AuthContext → ThemeContext → LanguageContext → CartContext → NotificationContext**. Each persists state to `localStorage` and exposes a hook:

| Context | Hook | localStorage keys |
|---|---|---|
| AuthContext | `useAuth()` | `token`, `user`, `isLoggedIn`, `sessionExpired` |
| ThemeContext | `useTheme()` | theme preference |
| LanguageContext | `useLanguage()` | language preference |
| CartContext | `useCart()` | `cart` |
| NotificationContext | `useNotifications()` | `admin-notifications` |

- **AuthContext** also enforces an inactivity auto-logout (5 min, throttled activity listeners) and handles backend `SESSION_TIMEOUT` 401s (which clear storage and hard-redirect to `/login`). `login(data)` accepts the backend AuthResponse `{ token, tokenType, user }`, stores the token, and aliases `user.name = user.fullName`.
- **NotificationContext** is an admin-panel notification feed (product/job/member/user/promotion/partner events), capped at 40 items.
- **CartContext** provides `addToCart`, `updateQuantity(id, delta)`, `removeItem`, `clearCart`, plus derived `totalItems` and `subtotal`. Both headers read `totalItems` for the badge.

### API Integration (src/api/api.js)

All backend requests go through a centralized `request()` function:
- Injects `Authorization: Bearer <token>` from localStorage
- Deletes `Content-Type` automatically for `FormData` bodies (file uploads)
- Throws on non-OK responses; API responses follow `{ success, message, data }`

API modules: `authAPI`, `productAPI`, `jobAPI`, `memberAPI`, `publicAPI`, `applicationAPI`, `userAPI`, `orderAPI`, `dashboardAPI`. Each module's doc comment records its DTO field names — treat those as the API contract.

Key endpoint conventions:
- Admin CRUD lives under `/admin/*`; public unauthenticated endpoints under `/public/*`
- Job applications send the resume as base64 TEXT fields (`resumeName`, `resumeData`, `resumeContentType`) — not multipart
- OTP flows are 3-step: send → verify → action (login OTP is phone-based; forgot-password is email-based, where reset uses email + newPassword directly, no reset token)
- `authAPI.socialLogin(provider, token)` — Google/Facebook/Telegram. With a provider-issued credential the backend verifies it server-side; without one it falls back to a legacy one-click demo account
- `userAPI.updateProfile(data)` (`PUT /users/me`) returns a fresh AuthResponse because the token is re-issued when the phone number changes

### Social Login Hooks (src/hooks/)

- `useGoogleLogin.js` — loads Google Identity Services, renders Google's own button into a returned `googleButtonRef` container (invisible overlay so user clicks land on Google's trusted iframe), and calls `onToken(idToken)`. Client ID comes from `VITE_GOOGLE_CLIENT_ID` or a fallback constant that must stay in sync with the backend's `application.yml`
- `useFacebookLogin.js`, `useTelegramLogin.js` — analogous provider hooks

### OAuth Login Flows

**Client-side (recommended for development):**
- Uses `useGoogleLogin`, `useFacebookLogin`, `useTelegramLogin` hooks
- Provider returns token directly to frontend
- Frontend calls `authAPI.socialLogin(provider, token)` to exchange for JWT
- Requires `VITE_GOOGLE_CLIENT_ID` env var (or fallback constant for demo)

**Server-side redirect (production alternative):**
- Backend redirects through `/oauth2/authorization/<provider>`
- Lands on `/oauth2/redirect?token=<jwt>`, handled by `src/Pages/Auth/OAuth2Redirect.jsx`
- See `OAUTH2_SETUP.md` and `FACEBOOK_SETUP.md` for setup details

### Route Structure (App.jsx)

Header choice is by exact pathname match: `/products`, `/promotion`, `/partners`, `/product-detail(s)`, `/orders`, `/tracking` use `Header2` (wrapped in `ShopLayout`); everything else uses `Header`. Admin paths hide header/footer entirely.

- `AdminRoute` allows roles **ADMIN and STORE** (STORE sees only products-side sections of `AdminD`). Note most `/add-*` and `/manage-users` legacy paths just render `AdminD`, which does internal section routing
- Shop pages are wrapped in `ShopLayout` (sidebar layout)
- All pages render inside `PageTransition` (keyed by pathname for animations); `ScrollToTop` resets scroll per route

### Bilingual Content Pattern

All user-facing text is `{ en: 'English', kh: 'ខ្មែរ' }` objects indexed by `lang` from `useLanguage()`:

```javascript
const { lang } = useLanguage()
<p>{text[lang]}</p>
```

## Environment Variables

- `VITE_GOOGLE_CLIENT_ID` — Google OAuth client ID (has a fallback constant in code for demo)
- Backend base URL hardcoded to `http://localhost:8081/api` in `src/api/api.js`

## Testing & Verification

No automated test framework is configured. Verify changes manually:
- Start dev server: `npm run dev`
- Test flows end-to-end via the browser (OAuth, cart, checkout, admin pages)
- Check browser console for errors
- Use Redux DevTools (if installed) to inspect state changes

## Troubleshooting

- **Dev server won't start on port 5173:** `strictPort: true` in `vite.config.js` prevents port fallback. Kill any process on port 5173 or change the config.
- **OAuth redirects to wrong URL:** Verify the redirect URI matches what's registered with the provider (should be `http://localhost:5173/oauth2/redirect`).
- **Backend requests fail with 401:** Check that `token` is in localStorage and hasn't expired. AuthContext auto-logs out at 5 min inactivity.
- **Images not loading:** Product images use Unsplash helpers in `src/data/products.js` — confirm Unsplash API is accessible.

## Backend Contract

- Base URL `http://localhost:8081/api` (hardcoded in `src/api/api.js`); CORS is open
- Backend runs on port 8081, frontend dev server on port 5173
- Login accepts multiple identifier types: username, full name, email, phone, telegram, facebook + password
- JWT stored in localStorage key `token`; tokens are tracked server-side for inactivity eviction (`POST /auth/logout` evicts)
- Register requires `phoneNumber` and `username`
- Roles: `ADMIN`, `STORE`, customer roles (compared case-insensitively on the frontend)

## Known Patterns & Quirks

- Demo data in `src/data/products.js` (80 products, 7 categories, bilingual) and `orders.js`; product images come from Unsplash helper functions
- Order tracking stages: placed → packed → transit → delivered
- File names contain spaces and special chars (`Popular Products.jsx`, `Terms&Privacy.jsx`) — quote them in shell commands
- Dev server must be on port 5173: the OAuth/social-login redirect URIs registered with providers point at it, and `vite.config.js` sets `strictPort: true` plus `allowedHosts: true` (for the ngrok tunnel)
