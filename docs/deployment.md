# SooGo Deployment Guide

## 대상 환경

- 애플리케이션: Next.js App Router
- 권장 배포 플랫폼: Vercel
- 필수 외부 의존성: Postgres (`DATABASE_URL`)

로컬 개발에서는 `DATABASE_URL`이 없으면 JSON 파일 fallback이 동작하지만,
실서비스 배포에서는 반드시 외부 Postgres를 연결해야 합니다.

## 권장 브랜치 흐름

현재 저장소는 `main` 브랜치 기준으로 CI 이후 프로덕션 자동 배포가 이어질 수 있으므로,
배포 안정성을 위해 아래 흐름을 권장합니다.

1. `feature/*`에서 작업합니다.
2. 작업이 정리되면 `feature -> dev`로 merge 합니다.
3. `dev` push 또는 관련 PR에서 CI로 통합 상태를 계속 검증합니다.
4. 실제 배포가 필요할 때만 `dev -> main`으로 올립니다.
5. `main` 반영 후 CI가 성공하면 프로덕션 배포가 진행됩니다.

반복 이슈와 검증된 해결 방법은 `docs/issue-resolution-log.md`에 기록해 다음 작업에서 먼저 참고합니다.

## 배포 전 체크리스트

```bash
npm run lint
npm run test:unit
npm run build
npm run test:e2e
```

아래 항목도 함께 확인하세요.

- `drizzle/` 아래 최신 migration 파일이 커밋되어 있는지
- `.env.example`가 현재 필요한 환경 변수를 반영하는지
- 공유/비교 링크가 snapshot 기반으로 정상 복원되는지
- 한국어 UI 문구와 카피가 최신 상태인지

## Vercel 기준 설정

### 1. GitHub 저장소 Import

- Repository: `MasJeong/SooGo`
- Framework Preset: Next.js
- Root Directory: repo root

### 2. 환경 변수

필수:

```bash
DATABASE_URL=postgres://...
```

현재 코드 기준으로 필수 배포 환경 변수는 `DATABASE_URL` 하나입니다.
`PGLITE_DATA_DIR`는 로컬 파일 fallback이 필요할 때만 선택적으로 사용합니다.

### 2-1. GitHub Actions 자동 배포 시크릿

`/.github/workflows/vercel-production.yml`를 쓰려면 아래 Repository Secrets를 설정하세요.

```bash
VERCEL_TOKEN=...
VERCEL_ORG_ID=...
VERCEL_PROJECT_ID=...
```

위 값은 `vercel login` 또는 Vercel 대시보드 프로젝트 연결 이후 확인할 수 있습니다.

### 3. Build / Install

- Install Command: `npm install`
- Build Command: `npm run build`

기본값으로 충분하지만, 커스텀 설정이 필요한 경우에도 위 값을 유지하세요.

### 4. 런타임 확인

배포 직후 최소한 아래를 확인하세요.

- 메인 추천 화면 `/`
- 저장 복원 화면 `/s/[snapshotId]`
- 비교 화면 `/compare/[snapshotId]`
- 추천 API `/api/recommendations`
- 인증 페이지 `/auth`
- 여행 프로필 페이지 `/account`

## 운영 메모

- `middleware.ts`가 공통 보안 헤더와 API `X-Robots-Tag`를 설정합니다.
- 인증은 이메일/비밀번호 + httpOnly 세션 쿠키 방식입니다.
- 추천 결과는 인스타그램을 랭킹 엔진으로 쓰지 않고, 분위기/최신성 보조 근거로만 사용합니다.
- snapshot 복원은 실패 시 닫힌 상태로 멈추도록 설계되어 있으므로, 오류가 나면 데이터 누락이나 DB 연결 상태를 먼저 확인하세요.

## 아직 자동화되지 않은 것

- 배포 후 migration 자동 실행
- preview/production 환경 분리 문서

필요하면 다음 단계로 CI/CD와 production DB migration 전략을 추가할 수 있습니다.
