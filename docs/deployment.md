# WhereToNext Deployment Guide

## 대상 환경

- 애플리케이션: Next.js App Router
- 권장 배포 플랫폼: Vercel
- 필수 외부 의존성: Postgres (`DATABASE_URL`)

로컬 개발에서는 `DATABASE_URL`이 없으면 JSON 파일 대체 경로가 동작하지만,
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
- 외부 API 키 제한이 로컬 개발용에서 운영 도메인 기준으로 바뀌었는지

### 외부 API 키 제한 체크

- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
  - 클라이언트 인터랙티브 지도에서 직접 로드되므로 `HTTP referrers (websites)` 제한이 필수입니다.
  - `http://localhost:4010/*`, `http://127.0.0.1:4010/*`, 운영 도메인 `https://.../*`만 허용합니다.
  - `API restrictions`는 `Maps JavaScript API`만 허용하는 것이 기본입니다.
- `GOOGLE_MAPS_API_KEY`
  - 서버에서 주변 장소 검색을 호출하므로 공개 키와 분리해 운영합니다.
  - `API restrictions`는 `Places API`만 허용하는 것이 기본입니다.
- `YOUTUBE_API_KEY`
  - 운영 배포 전에는 `HTTP referrers (websites)` 또는 실제 사용 구조에 맞는 제한을 다시 확인합니다.
  - 테스트/로컬 도메인만 허용된 상태면 운영 도메인에서 `quotaExceeded`와 별개로 호출이 막힐 수 있으니, 운영 도메인 `https://.../*`를 반드시 추가합니다.
  - YouTube Data API v3 쿼터는 하루 10,000 units 기본값이라 `search.list` 호출 수를 함께 점검합니다.
- `OPENAI_API_KEY`
  - 브라우저가 아니라 서버 route에서만 사용하므로 공개 키처럼 두지 않습니다.
  - 운영에서는 서버 환경 변수로만 주입하고, 필요하면 `OPENAI_TRIP_ACTIONS_MODEL`로 모델명을 고정합니다.
  - AI 행동 제안이 실패해도 화면은 fallback 문구로 유지되므로, 초기 배포는 선택적으로 켜도 됩니다.
- 공통
  - 키는 `.env.local` 같은 로컬 환경 파일에만 두고 저장소에는 커밋하지 않습니다.
  - 운영 키와 개발 키를 분리할 수 있으면 분리하는 편이 안전합니다.

## Vercel 기준 설정

### 1. GitHub 저장소 가져오기

- Repository name target: `WhereToNext`
- Current remote slug: `MasJeong/WhereToNext`
- Framework Preset: Next.js
- Root Directory: repo root

### 2. 환경 변수

필수:

```bash
DATABASE_URL=postgres://...
```

현재 코드 기준으로 필수 배포 환경 변수는 `DATABASE_URL` 하나입니다.
아래 값은 기능 활성화 여부에 따라 선택적으로 필요합니다.

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
YOUTUBE_API_KEY=...
GOOGLE_MAPS_API_KEY=...
OPENAI_API_KEY=...
OPENAI_TRIP_ACTIONS_MODEL=gpt-5-mini
```

- `YOUTUBE_API_KEY`가 없으면 추천 결과 YouTube 패널은 fallback 링크만 보여줍니다.
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`가 없으면 지도는 정적 프리뷰 + 외부 Google 지도 링크만 보여줍니다.
- `GOOGLE_MAPS_API_KEY`가 없으면 주변 장소 목록은 비워 두고 지도와 다른 보조 정보만 보여줍니다.
- `OPENAI_API_KEY`가 없으면 AI 행동 제안은 규칙 기반 fallback만 보여줍니다.
- `PGLITE_DATA_DIR`는 로컬 파일 대체 경로가 필요할 때만 선택적으로 사용합니다.

### 2-1. GitHub Actions 자동 배포 시크릿

`/.github/workflows/vercel-production.yml`를 사용하려면 아래 저장소 비밀값을 설정하세요.

```bash
VERCEL_TOKEN=...
VERCEL_ORG_ID=...
VERCEL_PROJECT_ID=...
```

위 값은 `vercel login` 또는 Vercel 대시보드 프로젝트 연결 이후 확인할 수 있습니다.

### 3. 설치 / 빌드

- 설치 명령: `npm install`
- 빌드 명령: `npm run build`

기본값으로 충분합니다. 커스텀 설정이 필요하더라도 위 값은 유지하는 편이 안전합니다.

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
- 추천 결과는 인스타그램을 랭킹 엔진으로 쓰지 않고, 분위기와 최신성에 대한 보조 근거로만 사용합니다.
- snapshot 복원은 실패 시 닫힌 상태로 멈추도록 설계돼 있습니다. 오류가 나면 데이터 누락이나 DB 연결 상태를 먼저 확인하세요.

## 아직 자동화되지 않은 항목

- 배포 후 migration 자동 실행
- 미리보기/프로덕션 환경 분리 문서

필요하면 다음 단계에서 CI/CD와 운영용(production) DB migration 전략을 추가할 수 있습니다.
