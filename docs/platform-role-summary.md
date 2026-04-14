# 한눈에 보기

- `Vercel`은 웹 앱을 배포하는 곳입니다.
- `Cloudflare Registrar`, `Namecheap`, `Porkbun`은 도메인을 사는 곳입니다.
- `Cloudflare DNS`는 산 도메인을 실제 서비스로 연결하는 곳입니다.
- `Supabase`, `Neon`은 운영 데이터베이스를 두는 곳입니다.
- `App Store Connect`와 `Xcode`는 iOS 앱 제출용입니다.

# 플랫폼 역할 요약

| 플랫폼 | 역할 | 지금 우리에게 필요한지 | 추천 용도 |
|---|---|---:|---|
| `Vercel` | 웹 배포/호스팅 | 예 | `Next.js` 운영 배포 |
| `Cloudflare Registrar` | 도메인 구매/등록 | 선택 | `tteonabolkka.com` 구매 1순위 |
| `Cloudflare DNS` | 도메인 연결 | 선택 | 구매한 도메인을 `Vercel`로 연결 |
| `Supabase` | 관리형 Postgres + Auth + Storage | 선택 | DB 외 기능까지 같이 쓸 때 |
| `Neon` | 관리형 Postgres | 선택 | DB만 빠르게 붙일 때 |
| `Namecheap` | 도메인 구매/등록 | 선택 | `떠나볼까.com` fallback |
| `Porkbun` | 도메인 구매/등록 | 선택 | `떠나볼까.com` fallback |
| `App Store Connect` | iOS 제출 창구 | 예 | 메타데이터, TestFlight, 심사 제출 |
| `Xcode` | iOS 빌드/업로드 | 예 | Archive / Upload |

# 가장 단순한 추천 조합

1. `Vercel`
웹 운영 배포

2. `도메인 등록처`
`Cloudflare Registrar` 먼저 시도  
`떠나볼까.com`이 안 되면 `Namecheap` 또는 `Porkbun`

3. `운영 DB`
`Neon` 또는 `Supabase`

4. `iOS 제출`
`Xcode` + `App Store Connect`

# 우리 기준 최적안

## 1. 웹 배포

- `Vercel`
- 이유: 이 저장소가 `Next.js 16 App Router`이고, `vercel.json`도 이미 있다.

## 2. 메인 도메인

- `떠나볼까.com`
- 등록처 1순위: `Cloudflare Registrar`
- 안 되면: `Namecheap` 또는 `Porkbun`

## 3. 영문 백업 도메인

- `tteonabolkka.com`
- 등록처 1순위: `Cloudflare Registrar`

## 4. 운영 DB

- 빠르게 붙이려면: `Neon`
- 나중에 Auth/Storage까지 넓히려면: `Supabase`

# 한 줄 결론

`Vercel`은 배포, `Cloudflare/Namecheap/Porkbun`은 도메인 구매, `Supabase/Neon`은 DB입니다.  
서로 대체재가 아니라 역할이 다른 도구들입니다.
