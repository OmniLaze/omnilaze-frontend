# Repository Guidelines

## Project Structure & Module Organization
- Root entry: `App.tsx`, web entry: `index.ts`.
- Source in `src/`:
  - `components/` (PascalCase UI components), `hooks/` (custom hooks), `services/` (API/auth), `styles/` (CSS/TS styles), `constants/`, `contexts/`, `types/`, `data/`, `platform/` (platform-specific files like `useWebAdaptation.native.ts`).
- Static assets: `assets/`.
- Build output: `dist/`.
- Tooling: `webpack.config.js`, `tsconfig.json`.

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm start`: start Expo dev server (QR for mobile, web devtools).
- `npm run web` | `npm run android` | `npm run ios`: run on web/Android/iOS.
- `npm run build`: export static web build to `dist/`.
- `npm run build:production` | `npm run build:aws`: export with `REACT_APP_API_URL` set for backend.
- Deployment: see `DEPLOY.md` or `./deploy-frontend-aws.sh -h`.

## Coding Style & Naming Conventions
- TypeScript throughout; prefer explicit types for public props/APIs.
- Indentation: 2 spaces; single quotes; semicolons optional but be consistent.
- Components: PascalCase files (`src/components/OrderDetailModal.tsx`).
- Hooks: camelCase prefixed with `use` (`src/hooks/useOrderManagement.ts`).
- Constants: UPPER_SNAKE_CASE in `src/constants/index.ts`.
- Platform-specific code: use `.native.ts` for RN targets and plain `.ts` for web fallback.

## Testing Guidelines
- No test runner is configured yet. If adding tests, colocate as `*.test.ts(x)` under `src/` or `src/__tests__/` and propose `npm test` with Jest + React Testing Library (web) / RNTL (native) in your PR.
- Keep tests deterministic and mock network calls from `src/services/`.

## Commit & Pull Request Guidelines
- Use Conventional Commits: `feat:`, `fix:`, `refactor:`, etc. (English or 中文 ok). Example: `feat: add OrderHistorySidebar`.
- Branch names: `feature/<short-name>` or `fix/<short-name>`.
- PRs must include: summary, scope of changes, linked issues, and screenshots/GIFs for UI changes. Confirm local build (`npm run build`) passes.

## Security & Configuration Tips
- Required env vars: `REACT_APP_API_URL`, `REACT_APP_AMAP_KEY`. For local dev, set in shell or `.env` (do not commit).
- Production secrets belong in CI/CD (see `DEPLOY.md`). Avoid logging sensitive values.
# Repository Guidelines

## Project Structure & Module Organization
- Entry: `App.tsx` (Expo app), web entry `index.ts`.
- Source: `src/` — `components/`, `hooks/`, `services/`, `styles/`, `constants/`, `contexts/`, `types/`, `data/`, `platform/` (platform-specific files like `useWebAdaptation.native.ts`).
- Assets: `assets/` (images, icons). Web build output: `dist/`.
- Tooling/config: `package.json`, `tsconfig.json`, `webpack.config.js`, `DEPLOY.md`, scripts in root.

## Build, Test, and Development Commands
- `npm install` (or `npm ci` in CI): install deps.
- `npm start`: start Expo dev server (QR for mobile, web devtools).
- `npm run web` | `npm run android` | `npm run ios`: run on web/Android/iOS.
- `npm run build`: export static web build to `dist/`.
- `npm run build:production` | `npm run build:aws`: export with `REACT_APP_API_URL` preset (see `DEPLOY.md`).

## Coding Style & Naming Conventions
- Language: TypeScript. Indentation: 2 spaces. Quotes: single. Be consistent with semicolons.
- Components: PascalCase (`src/components/OrderDetailModal.tsx`). Hooks: `useCamelCase` (`src/hooks/useOrderManagement.ts`).
- Constants: UPPER_SNAKE_CASE in `src/constants/`. Assets: kebab-case filenames (e.g., `milk-tea.png`).
- Platform code: use `.native.ts(x)` for RN targets; `.ts(x)` for web fallback.
- Lint/format: no linter configured; prefer Prettier defaults (80–100 cols) if editing many files.

## Testing Guidelines
- No test runner configured yet. If adding tests, colocate as `src/**/*.test.ts(x)`.
- Recommend Jest + React Testing Library (web) and RNTL (native). Keep tests deterministic; mock `src/services/api`.

## Commit & Pull Request Guidelines
- Use Conventional Commits (`feat:`, `fix:`, `refactor:`). Example: `feat: add OrderHistorySidebar` (English or 中文 acceptable).
- Branches: `feature/<short-name>` or `fix/<short-name>`.
- PRs: clear description, scope, linked issues, and screenshots/GIFs for UI changes. Ensure `npm run build` passes.

## Security & Configuration Tips
- Required env vars: `REACT_APP_API_URL`, `REACT_APP_AMAP_KEY`. Set via shell or `.env` (do not commit). Example:
  - `export REACT_APP_API_URL=http://localhost:3000`
- CI/CD and secrets: see `DEPLOY.md` (S3/CloudFront). Use GitHub Secrets for credentials.

## Architecture Overview
- Expo + React Native Web single codebase targeting web and mobile. Theming via `src/contexts/ColorThemeContext`.
- Web-specific adaptations live in `src/platform/`; data and UI flows organized by steps in `src/data/stepContent` and hooks in `src/hooks/`.

