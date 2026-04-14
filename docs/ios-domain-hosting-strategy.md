# 한눈에 보기

- `떠나볼까?`의 운영 배포 플랫폼은 `Vercel`, 도메인 등록 1순위는 `Cloudflare Registrar`로 잡는 것이 가장 현실적이다.
- 이유는 저장소 스택이 이미 `Next.js 16 App Router`이고, `vercel.json`도 있어 Vercel이 가장 자연스럽기 때문이다.
- 다만 한글 메인 도메인 `떠나볼까.com`은 `IDN` 지원 여부를 마지막에 직접 확인해야 하므로, 안 되면 `Namecheap` 또는 `Porkbun`을 fallback 등록처로 쓴다.
- 영문 백업 도메인 `tteonabolkka.com`은 장기 갱신비와 DNS/SSL 운영 편의성 때문에 `Cloudflare Registrar`가 가장 유력하다.

# 목표

- iOS App Store 제출에 넣을 `Privacy Policy URL`, `Support URL`의 운영 도메인을 안정적으로 확보한다.
- 집에서 바로 실행할 수 있게 `배포 플랫폼`, `도메인 등록처`, `fallback 조건`을 한 문서에서 정리한다.

# 최종 선택안

## 1. 운영 배포 플랫폼

- 1순위: `Vercel`

## 2. 메인 공개 도메인

- 1순위: `떠나볼까.com`
- 등록처 1순위: `Cloudflare Registrar`
- 등록 불가 또는 IDN 처리 불안정 시 fallback: `Namecheap` 또는 `Porkbun`

## 3. 영문 백업 도메인

- 1순위: `tteonabolkka.com`
- 등록처 1순위: `Cloudflare Registrar`

# 왜 이 조합이 최적인가

## Vercel을 쓰는 이유

1. 이 저장소의 공식 기술 스택 문서가 이미 `배포: Vercel`로 정리돼 있다.
2. 실제 코드베이스가 `Next.js 16 App Router`라서, 배포 플랫폼과 프레임워크 조합이 가장 자연스럽다.
3. 저장소 루트에 `vercel.json`이 있고 `main` 브랜치 운영 배포 기준도 이미 있다.
4. App Store 제출용 `https://<운영도메인>/privacy`, `https://<운영도메인>/support`를 빠르게 만들기 가장 쉽다.
5. Preview URL과 Production URL이 분리돼 있어, App Store에는 Production URL만 고정하면 된다.

## Cloudflare Registrar를 1순위로 두는 이유

1. Cloudflare는 공식적으로 `at-cost`와 `no markup` 정책을 안내한다.
2. 장기 운영에서는 `첫해 할인`보다 `갱신비`가 더 중요하므로, 장기 총비용 관점에서 유리하다.
3. DNS, SSL, 보안, 리다이렉트 운영을 같이 보기에 편하다.
4. 영문 도메인 `tteonabolkka.com`처럼 일반 `.com`은 Cloudflare가 가장 무난하다.

## 한글 도메인에 fallback 등록처를 같이 두는 이유

1. `떠나볼까.com`은 `IDN(국제화 도메인)`이라 등록처별 지원 차이가 있을 수 있다.
2. Cloudflare에서 한글 `.com`이 바로 검색되면 가장 좋지만, 안 되면 그 자리에서 막히면 안 된다.
3. `Namecheap`은 공식적으로 `IDN`을 지원한다고 문서화돼 있고, `.com`에서 `Korean`을 지원한다고 안내한다.
4. `Porkbun`도 IDN 지원 문서가 있어 fallback 후보로 적합하다.
5. 그래서 전략은 `Cloudflare 먼저 확인 -> 안 되면 Namecheap/Porkbun` 순서가 가장 현실적이다.

# 실제 실행 순서

## 1단계. 운영 배포부터 확보

1. `Vercel`에 현재 저장소를 연결한다.
2. `main` 브랜치를 production 배포로 연결한다.
3. 먼저 `https://<project>.vercel.app/privacy`, `https://<project>.vercel.app/support`가 열리는지 확인한다.

## 2단계. 도메인 구매

1. `Cloudflare Registrar`에서 `떠나볼까.com` 검색
2. `Cloudflare Registrar`에서 `tteonabolkka.com` 검색
3. `떠나볼까.com`이 되면 둘 다 Cloudflare에서 진행
4. `떠나볼까.com`이 안 되면:
   - `떠나볼까.com`은 `Namecheap` 또는 `Porkbun`
   - `tteonabolkka.com`은 `Cloudflare`

## 3단계. 도메인 연결

1. 메인 도메인: `떠나볼까.com`
2. 보조 도메인: `www.떠나볼까.com`
3. 백업 도메인: `tteonabolkka.com`
4. `떠나볼까.com/privacy`
5. `떠나볼까.com/support`

## 4단계. App Store 제출에 넣을 값

- Privacy Policy URL: `https://떠나볼까.com/privacy`
- Support URL: `https://떠나볼까.com/support`

# 비용 판단 기준

## Cloudflare가 유리한 경우

- 첫해보다 장기 갱신비가 중요할 때
- 영문 `.com`을 안정적으로 오래 운영할 때
- DNS/SSL을 같이 단순하게 운영하고 싶을 때

## Namecheap 또는 Porkbun이 유리한 경우

- 한글 IDN 등록 가능 여부를 빨리 확인해야 할 때
- Cloudflare에서 `떠나볼까.com` 등록이 막히는 경우
- 한 계정에서 바로 구매 완료를 끝내고 싶을 때

# 주의할 점

1. App Store에는 `preview URL`이 아니라 `production URL`만 넣는다.
2. `/support`는 공개 페이지이므로 공개 가능한 운영자 이름과 이메일만 둔다.
3. 전화번호는 `App Review Information`에만 넣고, 공개 페이지에는 넣지 않는다.
4. `떠나볼까.com`은 내부적으로 `punycode` 형태로 보일 수 있는데 정상이다.

# 현재 결론

가장 현실적인 경로는 다음과 같다.

1. `Vercel`로 운영 배포
2. `Cloudflare Registrar`에서 `떠나볼까.com`, `tteonabolkka.com` 먼저 검색
3. `떠나볼까.com`이 되면 둘 다 Cloudflare
4. `떠나볼까.com`이 안 되면 한글 도메인만 `Namecheap` 또는 `Porkbun` fallback

# 공식 참고 링크

- Vercel custom domain: https://vercel.com/docs/domains/set-up-custom-domain
- Cloudflare Registrar: https://www.cloudflare.com/products/registrar/
- Cloudflare Registrar docs: https://developers.cloudflare.com/registrar/about/
- Namecheap domains: https://www.namecheap.com/domains/
- Namecheap IDN support: https://www.namecheap.com/support/knowledgebase/article.aspx/238/35/do-you-support-idn-domains-and-emojis/
- Porkbun `.com`: https://porkbun.com/tld/com
- Porkbun IDN support: https://kb.porkbun.com/article/210-what-are-idn-domains-and-how-do-i-register-them
