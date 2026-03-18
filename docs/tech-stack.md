# SooGo Tech Stack

## 개요

SooGo는 `Next.js App Router` 기반의 풀스택 웹 애플리케이션입니다.
추천 UI, API, 데이터 접근, 테스트, 배포를 하나의 TypeScript 코드베이스에서 관리합니다.

## 핵심 스택

- Framework: `Next.js 16`, `React 19`
- Language: `TypeScript 5` (`strict`)
- Styling: `Tailwind CSS 4`, `@tailwindcss/postcss`
- Validation: `Zod`
- ORM / DB: `Drizzle ORM`, production `Postgres`, local/test `PGlite`
- Testing: `Vitest`, `Testing Library`, `Playwright`
- Tooling: `ESLint 9`, `tsx`, `dotenv`
- Package manager: `npm`
- Deployment: `Vercel`

## 구조 메모

- App Router: `src/app/`
- API routes: `src/app/api/**/route.ts`
- Business logic: `src/lib/`
- DB runtime and schema: `src/lib/db/`

## 주요 스크립트

```bash
npm run dev
npm run build
npm run lint
npm run test:unit
npm run test:e2e
npm run db:generate
npm run db:seed
```

## 참고 소스

- `package.json`
- `AGENTS.md`
- `docs/deployment.md`
