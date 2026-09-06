# RAYU.md

This file provides guidance to RAYU when working with code in this repository.

## Commands

- `npm run dev` - Start local development server (Vite)
- `npm run build` - Build production bundle (`dist/`)
- `npm run lint` - Run ESLint across codebase
- `npm run preview` - Preview production build locally

## Architecture & Structure

### Technology Stack
- **Framework**: React 19, Vite, React Router v7
- **Styling**: Tailwind CSS v4 (configured in `src/index.css` via `@theme`) + component/page-level CSS files
- **Icons**: `flag-icons` (SVG flags via `LanguageSwitcher.jsx`)

### Brand Colors & Design System
Defined as CSS custom variables in `@theme` (`src/index.css`) and component stylesheets:
- **Primary Green**: `#77BC1F` (`--color-brand-500`)
- **Accent Orange**: `#FF9900` (`--color-accent-500`)
- **Black**: `#0B0F14` (`--color-navy-900`)
- **Navy**: `#232F3F` (`--color-navy-800`)
- **Typography**: Montserrat (English) & Kantumruy Pro (Khmer) imported via Google Fonts in `src/index.css`

### Application Layout & Routing (`src/App.jsx`)
- **Routing**: Uses `react-router-dom` with page transitions (`src/components/PageTransition.jsx`) and scroll restoration (`src/components/ScrollToTop.jsx`).
- **Header Selection**:
  - `Header2` (`src/components/Header2.jsx`) is rendered on `/products` and `/promotion` routes.
  - `Header` (`src/components/Header.jsx`) is rendered on all other standard customer pages.
  - Admin routes (`/admin/*`) hide both Header and Footer.
- **Language Provider**: Wrapped with `LanguageContext` (`src/context/LanguageContext.jsx`) managing bilingual text switching (`en` / `kh`).

### Codebase Organization
- `src/components/`: Shared UI components (`Header.jsx`, `Header2.jsx`, `Footer.jsx`, `Logo.jsx`, `LanguageSwitcher.jsx`)
- `src/context/`: Context providers (`LanguageContext.jsx`)
- `src/Pages/`: Top-level page views (e.g. `Home.jsx`, `Popular Products.jsx`, `Promotion.jsx`, `Cart.jsx`, `Auth/` directory)
