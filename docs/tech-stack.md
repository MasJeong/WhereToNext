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

## 플랫폼 역할

- `Cloudflare`: 운영 도메인, DNS, SSL, CDN, WAF 같은 앞단 네트워크 계층
- `Vercel`: `Next.js` 앱 배포, 페이지 렌더링, API route 실행
- `Supabase`: 운영 `Postgres` 데이터베이스와 백엔드 데이터 기반
- `GitHub`: 저장소, 브랜치/PR 협업, CI 기준 저장소

현재 운영 구조는 보통 아래 흐름으로 이해하면 됩니다.

```text
사용자 브라우저
  -> Cloudflare
  -> Vercel
  -> Supabase Postgres
```

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
- `docs/platform-role-summary.md`
