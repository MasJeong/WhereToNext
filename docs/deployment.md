# 떠나볼래? 배포 안내

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
2. 작업이 정리되면 `feature -> dev`로 병합합니다.
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

- `GOOGLE_MAPS_API_KEY`
  - 현재 구조는 `Maps Embed API`를 `iframe`으로 쓰므로, 운영 배포 전에는 `HTTP referrers (websites)` 제한으로 바꿉니다.
  - 로컬 개발용 `http://localhost:4010/*`, `http://127.0.0.1:4010/*`가 남아 있다면 운영 도메인 `https://.../*`를 추가하고 불필요한 로컬 항목은 정리합니다.
  - `API restrictions`는 `Maps Embed API`만 허용하는 것이 기본입니다.
- `YOUTUBE_API_KEY`
  - 운영 배포 전에는 `HTTP referrers (websites)` 또는 실제 사용 구조에 맞는 제한을 다시 확인합니다.
  - 테스트/로컬 도메인만 허용된 상태면 운영 도메인에서 `quotaExceeded`와 별개로 호출이 막힐 수 있으니, 운영 도메인 `https://.../*`를 반드시 추가합니다.
  - YouTube Data API v3 쿼터는 하루 10,000 units 기본값이라 `search.list` 호출 수를 함께 점검합니다.
- 공통
  - 키는 `.env.local` 같은 로컬 환경 파일에만 두고 저장소에는 커밋하지 않습니다.
  - 운영 키와 개발 키를 분리할 수 있으면 분리하는 편이 안전합니다.

## Vercel 기준 설정

### 1. GitHub 저장소 가져오기

- 저장소 이름 대상: `WhereToNext`
- 현재 원격 저장소 식별값: `MasJeong/WhereToNext`
- 프레임워크 프리셋: Next.js
- 루트 디렉터리: 저장소 루트

### 2. 환경 변수

필수:

```bash
DATABASE_URL=postgres://...
```

현재 코드 기준으로 필수 배포 환경 변수는 `DATABASE_URL` 하나입니다.
아래 값은 기능 활성화 여부에 따라 선택적으로 필요합니다.

```bash
YOUTUBE_API_KEY=...
GOOGLE_MAPS_API_KEY=...
```

- `YOUTUBE_API_KEY`가 없으면 추천 결과 YouTube 패널은 fallback 링크만 보여줍니다.
- `GOOGLE_MAPS_API_KEY`가 없으면 추천 결과와 상세 화면 지도 임베드는 표시되지 않습니다.
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
