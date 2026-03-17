# Trip Compass

[![CI](https://github.com/MasJeong/trip-compass/actions/workflows/ci.yml/badge.svg)](https://github.com/MasJeong/trip-compass/actions/workflows/ci.yml)

Trip Compass는 로그인 없이 바로 사용하는 해외 여행지 추천 플랫폼입니다.
사용자가 동행, 예산, 일정, 여행 시기, 분위기를 선택하면 설명 가능한 추천 엔진이 목적지를 제안하고,
각 결과 카드에는 Instagram vibe 근거와 저장/공유/비교 흐름이 함께 붙습니다.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/MasJeong/trip-compass)

## 핵심 특징

- 로그인 없이 바로 추천, 저장 링크, 비교 링크 생성
- 결정형 추천 엔진 기반의 설명 가능한 결과
- 인스타그램은 추천 엔진이 아니라 분위기/최신성 증거 레이어로만 사용
- 저장 링크 `/s/[snapshotId]`, 비교 링크 `/compare/[snapshotId]`
- 로그인은 가벼운 이메일/비밀번호 + 세션 쿠키 방식으로 동작
- 다녀온 여행지 평점, 태그, 재방문 의사에 따라 추천을 미세하게 개인화
- 로컬 개발은 JSON 파일 fallback, 테스트는 메모리 fallback, 운영은 `DATABASE_URL` 기반 Postgres 사용

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 열면 됩니다.

## 환경 변수

기본 개발 환경에서는 외부 DB 없이도 동작합니다.

운영 또는 외부 Postgres 연결 시에는 `.env.local`에 아래 값을 설정하세요.

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/trip_compass
PGLITE_DATA_DIR=.data/trip-compass
```

`DATABASE_URL`이 없으면 로컬 개발에서는 `.data/trip-compass-local-store.json` 파일 fallback을 사용합니다.
테스트에서는 메모리 fallback을 사용합니다.
배포 환경에서는 반드시 외부 Postgres를 연결하세요.

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

## 배포

가장 간단한 배포 대상은 Vercel입니다.

1. GitHub 저장소를 Import 합니다.
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

## 데이터 / 저장 정책

- 추천 카탈로그는 36개 해외 목적지로 시작합니다.
- 추천 스냅샷은 저장 당시의 recommendation 결과를 함께 저장해 복원 시 재계산 드리프트를 줄입니다.
- 비교 스냅샷은 저장된 추천 스냅샷 2~4개를 묶어 복원합니다.
- 인스타그램 관련 표시는 공식 계정, 해시태그 캡슐, 큐레이션, 대체 소스 라벨을 명시합니다.
- 계정 사용자는 방문했던 여행지, 평점, 태그, 재방문 의사를 남길 수 있습니다.
- 추천은 `repeat / balanced / discover` 선호에 따라 미세 조정됩니다.

## 현재 범위에서 제외한 것

- 예약, 결제, 지도, CMS
- 비공식 인스타그램 스크래핑
- 장소 단위 전역 트렌드 탐색
