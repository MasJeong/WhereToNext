# 떠나볼래?

> 저장소 이름: `WhereToNext`

[![CI](https://github.com/MasJeong/WhereToNext/actions/workflows/ci.yml/badge.svg)](https://github.com/MasJeong/WhereToNext/actions/workflows/ci.yml)

떠나볼래는 로그인 없이 바로 사용하는 해외 여행지 추천 플랫폼입니다.
사용자가 동행, 예산, 일정, 여행 시기, 분위기를 선택하면 설명 가능한 추천 엔진이 목적지를 제안하고,
각 결과 카드에는 인스타그램 분위기 근거와 저장/공유/비교 흐름이 함께 붙습니다.
대표 추천 1곳에는 외부 여행 보조 데이터와 함께 YouTube 기반 소셜 비디오 근거 블록이 붙을 수 있습니다.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/MasJeong/WhereToNext)

## 핵심 특징

- 로그인 없이 바로 추천, 저장 링크, 비교 링크 생성
- 결정형 추천 엔진 기반의 설명 가능한 결과
- 인스타그램은 추천 엔진이 아니라 분위기/최신성 증거 레이어로만 사용
- 대표 추천 1곳에는 여행지 이미지, 날씨, 작은 지도, 주변 장소, 환율 참고 정보가 함께 붙음
- 대표 추천 1곳에는 YouTube 우선 소셜 비디오 블록이 선택적으로 붙음
- 소셜 비디오는 한국어/한국인 업로드 후보를 우선하고, 짧은 형식 영상을 선호하되 적절한 후보가 없으면 일반 여행 영상도 허용함
- 저장 링크 `/s/[snapshotId]`, 비교 링크 `/compare/[snapshotId]`
- 추천 둘러보기는 익명으로 열어 두고, 저장/공유/계정 연속성은 소셜 로그인 + 세션 쿠키 방식으로 처리
- 다녀온 여행지 평점, 태그, 재방문 의사에 따라 추천을 미세하게 개인화
- 운영은 `DATABASE_URL` 기반 Postgres를 사용하고, 로컬/테스트는 `PGlite` 대체 경로로 동작

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:4010`을 열면 됩니다.

## 환경 변수

기본 개발 환경에서는 외부 DB 없이도 동작합니다.

운영 또는 외부 Postgres 연결 시에는 `.env.local`에 아래 값을 설정하세요.

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/trip_compass
PGLITE_DATA_DIR=.data/trip-compass
UNSPLASH_ACCESS_KEY=
GOOGLE_MAPS_API_KEY=
EXCHANGERATE_HOST_ACCESS_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
APPLE_CLIENT_ID=
APPLE_CLIENT_SECRET=
MOCK_OAUTH_PROVIDER=false
```

> 참고: 현재 GitHub 원격 저장소 식별값은 `MasJeong/WhereToNext`입니다.

`DATABASE_URL`이 없으면 `PGlite` 대체 경로를 사용합니다.
로컬 개발에서 `PGLITE_DATA_DIR`가 설정되어 있으면 해당 디렉터리에 데이터를 유지하고, 테스트에서는 메모리 기반 `PGlite`를 사용합니다.
배포 환경에서는 반드시 외부 Postgres를 연결하세요.
외부 여행 보조 데이터는 대표 추천 1곳에만 붙고, 공유 링크를 열면 이미지/날씨/지도/환율을 다시 조회합니다. 공급자 키가 없거나 일부 호출이 실패하면 해당 블록만 숨기고 추천 결과 자체는 그대로 보여줍니다.
YouTube 소셜 비디오는 서버에서 `YOUTUBE_API_KEY`를 사용해 조회하며, 키가 없거나 후보 품질이 낮으면 블록을 숨기고 추천 결과는 그대로 유지합니다.
소셜 로그인은 Google / Kakao / Apple 공급자를 사용하며, 각 공급자의 콜백 URL은 `/api/auth/oauth/[provider]/callback` 형식으로 맞춰야 합니다.
Playwright 기반 소셜 로그인 E2E는 `MOCK_OAUTH_PROVIDER=true`일 때 로컬 모의 authorize 라우트를 사용합니다.
실제 공급자 콘솔 설정과 운영 반영 방법은 `docs/social-login-setup.md`를 참고하세요.

## 주요 스크립트

```bash
npm run lint
npm run build
npm run test:unit
npm run test:e2e
npm run test:smoke
npm run db:generate
npm run db:seed
```

## Git 운영 방식

자동 배포를 유지하는 사이드프로젝트 기준이라면 `main`을 바로 작업하기보다 `feature -> dev -> main` 흐름으로 운영하는 편을 권장합니다.

1. 기능 작업은 항상 `feature/...` 브랜치에서 진행합니다.
2. 기능이 준비되면 `feature -> dev`로 병합합니다.
3. `dev`에서는 push 또는 PR 기준으로 CI를 통해 통합 상태를 계속 검증합니다.
4. 배포할 준비가 되었을 때만 `dev -> main`으로 올립니다.
5. 프로덕션 자동 배포는 `main`에 반영된 코드만 기준으로 진행합니다.

반복적으로 발생한 문제와 검증된 해결 방법은 `docs/issue-resolution-log.md`에 누적합니다.

## 배포

가장 간단한 배포 대상은 Vercel입니다.

1. GitHub 저장소를 가져옵니다.
2. 프레임워크는 Next.js로 자동 인식됩니다.
3. 환경 변수에 `DATABASE_URL`을 추가합니다.
4. 첫 배포 전에 `npm run db:generate` 결과가 커밋되어 있는지 확인합니다.
5. 배포 후 `/`, `/s/[snapshotId]`, `/compare/[snapshotId]`, `/api/recommendations`가 정상 응답하는지 확인합니다.

GitHub Actions로 자동 배포하려면 아래 GitHub Secrets가 필요합니다.

```bash
VERCEL_TOKEN=
VERCEL_ORG_ID=
VERCEL_PROJECT_ID=
```

배포 상세 체크리스트는 `docs/deployment.md`를 참고하세요.

현재 저장소 설정에서는 `main`에 push한 뒤 CI가 성공하면 프로덕션 배포가 이어질 수 있습니다.
그래서 평소 작업과 통합 검증은 `dev` 브랜치에서 마치고, `main`은 배포 시점에만 업데이트하는 편이 더 안전합니다.

## 데이터 / 저장 정책

- 추천 카탈로그는 60개 해외 목적지로 시작합니다.
- 추천 스냅샷은 저장 당시의 recommendation 결과를 함께 저장해 복원 시 재계산 흔들림을 줄입니다.
- 비교 스냅샷은 저장된 추천 스냅샷 2~4개를 묶어 복원합니다.
- 인스타그램 관련 표시는 공식 계정, 해시태그 캡슐, 큐레이션, 대체 소스 라벨을 명시합니다.
- 계정 사용자는 방문했던 여행지, 평점, 태그, 재방문 의사를 남길 수 있습니다.
- 추천은 `repeat / balanced / discover` 선호에 따라 미세 조정됩니다.

## 현재 범위에서 제외한 것

- 예약, 결제, 지도, CMS
- 비공식 인스타그램 스크래핑
- 장소 단위 전역 트렌드 탐색
