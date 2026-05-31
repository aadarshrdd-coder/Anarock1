# WanderLog

A React + Vite travel bucket list app with authentication, protected routes, country search and details, and per-user saved travel plans.

## Run locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```
3. Open the displayed localhost URL in your browser.

## Credentials

- Email: `eve.holt@reqres.in`
- Password: any password

## App components

- `App` — root application shell and router setup.
- `useAuth` — auth state management and localStorage persistence.
- `useBucket` — per-user bucket list/visited state persistence.
- `AuthPage` — login/signup UI with route-aware tab navigation and mock Google auth.
- `Navbar` — topbar with user info, bucket/visited counts, and logout.
- `ExplorePage` — country search/filter grid with bucket actions and clickable country cards.
- `CountryDetailPage` — full country detail view with add-to-bucket and visited toggles.

## What I would improve with more time

- Add better country sorting and more advanced filters.
- Improve the detail page with neighboring country navigation.
- Add animated transitions and a more polished responsive design.
