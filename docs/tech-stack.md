# 떠나볼래 기술 스택

## 개요

SooGo는 `Next.js App Router` 기반의 풀스택 웹 애플리케이션입니다.
추천 UI, API, 데이터 접근, 테스트, 배포를 하나의 TypeScript 코드베이스에서 관리합니다.

## 핵심 스택

- 프레임워크: `Next.js 16`, `React 19`
- 언어: `TypeScript 5` (`strict`)
- 스타일링: `Tailwind CSS 4`, `@tailwindcss/postcss`
- 검증: `Zod`
- ORM / DB: `Drizzle ORM`, 운영 환경 `Postgres`, 로컬/테스트 `PGlite`
- 테스트: `Vitest`, `Testing Library`, `Playwright`
- 도구: `ESLint 9`, `tsx`, `dotenv`
- 패키지 매니저: `npm`
- 배포: `Vercel`

## 구조 메모

- App Router: `src/app/`
- API 라우트: `src/app/api/**/route.ts`
- 비즈니스 로직: `src/lib/`
- DB 런타임과 스키마: `src/lib/db/`

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

## 참고 문서

- `package.json`
- `AGENTS.md`
- `docs/deployment.md`
