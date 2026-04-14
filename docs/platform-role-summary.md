# 한눈에 보기

- `Cloudflare`는 `떠나볼까.com` 같은 운영 도메인을 연결하고 DNS, SSL, CDN, 보안을 맡습니다.
- `Vercel`은 `Next.js` 애플리케이션을 배포하고 실행합니다.
- `Supabase`는 운영 `Postgres` 데이터베이스와 백엔드 데이터 기반을 맡습니다.
- 셋은 대체재가 아니라 역할이 다른 운영 구성 요소입니다.

## 전체 구조

```text
사용자 브라우저
  -> Cloudflare
  -> Vercel
  -> Supabase Postgres
```

## 플랫폼별 역할

| 플랫폼 | 이 프로젝트에서 하는 일 | 지금 기준 사용 이유 |
| --- | --- | --- |
| `Cloudflare` | 운영 도메인 연결, DNS, SSL, CDN, WAF/봇 차단 | `떠나볼까.com`을 서비스 앞단에 붙이고 트래픽과 보안을 관리하기 위해 |
| `Vercel` | `Next.js` 앱 배포, 페이지 렌더링, API route 실행 | 저장소가 `Next.js App Router` 중심이라 배포 경로가 가장 자연스럽기 때문 |
| `Supabase` | 운영 `Postgres` 데이터베이스 | `DATABASE_URL` 기반 영속 데이터와 계정/스냅샷 데이터를 운영 환경에서 저장하기 위해 |
| `GitHub` | 저장소, 브랜치 전략, PR, Actions 기반 CI/CD | 코드 변경과 배포 흐름의 기준 저장소이기 때문 |

## 기술과 연결해서 보면

### `Cloudflare`

- 사용 위치: 앱 바깥 네트워크 앞단
- 담당 범위:
  - `떠나볼까.com` DNS 관리
  - SSL 인증서와 HTTPS 종단
  - 정적 자산 캐싱과 전송 최적화
  - WAF, 봇 차단, 기본 보안 정책
- 하지 않는 일:
  - `Next.js` 앱 빌드/실행
  - 데이터베이스 저장

### `Vercel`

- 사용 위치: 웹 애플리케이션 호스팅
- 담당 범위:
  - `Next.js 16 App Router` 배포
  - `src/app/` 페이지 렌더링
  - `src/app/api/**/route.ts` 실행
  - 환경 변수 주입
  - 브랜치/프로덕션 배포 관리
- 하지 않는 일:
  - 운영 DB 자체 보관
  - 도메인 등록처 역할

### `Supabase`

- 사용 위치: 데이터 계층
- 담당 범위:
  - 운영 `Postgres`
  - 애플리케이션 영속 데이터 저장
  - 필요 시 인증, 스토리지 같은 백엔드 기능 확장
- 이 저장소에서 직접 연결되는 핵심 값:
  - `DATABASE_URL`
- 하지 않는 일:
  - `Next.js` 프론트엔드 배포
  - 운영 도메인 라우팅

## 이 저장소 기준 실제 매핑

- 프론트엔드/서버 앱: `Next.js`, `React`, `TypeScript`
- 배포 실행 위치: `Vercel`
- 운영 데이터 저장: `Supabase Postgres`
- 도메인과 네트워크 앞단: `Cloudflare`
- ORM / DB 접근: `Drizzle ORM`
- 로컬 대체 DB: `PGlite`

## 헷갈리기 쉬운 포인트

- `Cloudflare`와 `Vercel`은 대체 관계가 아닙니다. `Cloudflare`는 앞단 네트워크/도메인이고, `Vercel`은 앱 호스팅입니다.
- `Supabase`와 `Vercel`도 대체 관계가 아닙니다. `Supabase`는 데이터 계층이고, `Vercel`은 앱 실행 계층입니다.
- 이 프로젝트에서 보통 필요한 운영 순서는 `Supabase` 연결 -> `Vercel` 배포 -> `Cloudflare` 도메인 연결입니다.
