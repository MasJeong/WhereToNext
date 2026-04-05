# 소셜 로그인 실제 설정 가이드

## 한눈에 보기

- 이 저장소의 소셜 로그인은 `Google`, `Kakao`, `Apple` 3개 공급자를 `OAuth redirect + server callback` 방식으로 연결합니다.
- 프런트가 SDK로 직접 로그인하지 않고, `/api/auth/oauth/[provider]/start`가 공급자 인증 화면으로 보내고 `/api/auth/oauth/[provider]/callback`이 서버에서 코드를 교환합니다.
- 실제 동작에는 각 공급자 콘솔 설정과 `.env.local` 또는 배포 환경 변수 설정이 모두 필요합니다.
- 로컬 개발에서는 `MOCK_OAUTH_PROVIDER=true`로 모의 로그인 테스트가 가능하고, 실제 공급자 로그인 검증은 공개 HTTPS 도메인에서 진행하는 편이 안전합니다.
- 특히 Apple은 웹용 Sign in with Apple 특성상 `localhost`만으로 끝내기 어렵기 때문에 운영 도메인 또는 터널링된 HTTPS URL 기준으로 준비하는 것이 맞습니다.

## 현재 코드가 요구하는 값

아래 값이 없으면 서버는 `OAUTH_ENV_MISSING:<ENV_NAME>` 오류를 냅니다.

```env
NEXT_PUBLIC_APP_ORIGIN=https://your-domain.example
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
APPLE_CLIENT_ID=
APPLE_CLIENT_SECRET=
MOCK_OAUTH_PROVIDER=false
```

코드 기준 참고 파일:

- `src/lib/oauth-provider-service.ts`
- `src/app/api/auth/oauth/[provider]/start/route.ts`
- `src/app/api/auth/oauth/[provider]/callback/route.ts`
- `src/lib/runtime/url.ts`

## 이 저장소의 콜백 URL 규칙

각 공급자는 아래 콜백 URL을 그대로 등록해야 합니다.

- Google: `https://<APP_ORIGIN>/api/auth/oauth/google/callback`
- Kakao: `https://<APP_ORIGIN>/api/auth/oauth/kakao/callback`
- Apple: `https://<APP_ORIGIN>/api/auth/oauth/apple/callback`

로컬 4010 포트 예시는 다음과 같습니다.

- `http://localhost:4010/api/auth/oauth/google/callback`
- `http://localhost:4010/api/auth/oauth/kakao/callback`
- `http://localhost:4010/api/auth/oauth/apple/callback`

단, Apple은 실제 웹 설정에서 `localhost`로 마무리하지 말고 공개 HTTPS 도메인을 기준으로 준비하는 편이 맞습니다.

## 공통 준비 순서

1. 서비스 기준 도메인을 먼저 정합니다.
2. `NEXT_PUBLIC_APP_ORIGIN`을 그 도메인으로 맞춥니다.
3. 각 공급자 콘솔에 위 도메인의 callback URL을 등록합니다.
4. 공급자별 `CLIENT_ID`, `CLIENT_SECRET`을 발급받아 환경 변수에 넣습니다.
5. 배포 환경에서 `MOCK_OAUTH_PROVIDER=false`로 둡니다.
6. `npm run build && npm run start`로 production 빌드 기준 동작을 확인합니다.

## Google 설정 방법

코드에서 쓰는 방식:

- authorize endpoint: `https://accounts.google.com/o/oauth2/v2/auth`
- token endpoint: `https://oauth2.googleapis.com/token`
- scope: `openid email profile`
- 필수 env: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

설정 절차:

1. Google Cloud Console에서 프로젝트를 선택합니다.
2. `Google Auth Platform` 또는 `APIs & Services`에서 OAuth 설정 화면으로 이동합니다.
3. 앱 브랜딩 또는 OAuth 동의 화면을 먼저 구성합니다.
4. OAuth client를 `Web application`으로 생성합니다.
5. Authorized redirect URI에 `https://<APP_ORIGIN>/api/auth/oauth/google/callback`을 등록합니다.
6. 발급된 Client ID와 Client Secret을 환경 변수에 넣습니다.

주의:

- 이 저장소는 서버에서 authorization code를 교환하므로, redirect URI가 코드와 정확히 같아야 합니다.
- Google 콘솔 UI가 origin 입력을 요구하면 `https://<APP_ORIGIN>`도 함께 등록해 두는 편이 안전합니다.
- 로컬 테스트를 실제 Google 계정으로 해 보려면 `http://localhost:4010/api/auth/oauth/google/callback`도 별도 등록해야 합니다.

공식 참고:

- https://developers.google.com/identity/protocols/oauth2/web-server
- https://support.google.com/cloud/answer/15549257

## Kakao 설정 방법

코드에서 쓰는 방식:

- authorize endpoint: `https://kauth.kakao.com/oauth/authorize`
- token endpoint: `https://kauth.kakao.com/oauth/token`
- profile endpoint: `https://kapi.kakao.com/v2/user/me`
- 필수 env: `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET`

설정 절차:

1. Kakao Developers에서 애플리케이션을 생성합니다.
2. `카카오 로그인`을 활성화합니다.
3. Redirect URI에 `https://<APP_ORIGIN>/api/auth/oauth/kakao/callback`을 등록합니다.
4. REST API 키를 `KAKAO_CLIENT_ID`로 사용합니다.
5. Client Secret 사용이 켜져 있다면 발급 값을 `KAKAO_CLIENT_SECRET`에 넣습니다.
6. 동의항목에서 이메일을 사용할 계획이면 계정 이메일 제공 항목도 함께 설정합니다.

주의:

- 현재 코드에는 `KAKAO_CLIENT_SECRET`이 필수입니다. Kakao 콘솔에서 Client Secret 기능을 켜고 값을 발급받아야 합니다.
- 이메일 제공 동의가 빠지면 공급자 프로필 정규화 결과가 기대보다 제한될 수 있습니다.
- 로컬 테스트를 할 때는 `http://localhost:4010/api/auth/oauth/kakao/callback`도 Redirect URI에 추가해야 합니다.

공식 참고:

- https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api
- https://developers.kakao.com/docs/latest/ko/kakaologin/prerequisite

## Apple 설정 방법

코드에서 쓰는 방식:

- authorize endpoint: `https://appleid.apple.com/auth/authorize`
- token endpoint: `https://appleid.apple.com/auth/token`
- response mode: `form_post`
- 필수 env: `APPLE_CLIENT_ID`, `APPLE_CLIENT_SECRET`

설정 절차:

1. Apple Developer에서 `Sign in with Apple` 사용이 가능한 식별자를 준비합니다.
2. 웹 로그인용 `Services ID`를 만들고 Sign in with Apple을 활성화합니다.
3. 웹 도메인과 Return URL에 `https://<APP_ORIGIN>` 및 `https://<APP_ORIGIN>/api/auth/oauth/apple/callback`을 등록합니다.
4. `APPLE_CLIENT_ID`에는 보통 Services ID 값을 넣습니다.
5. `APPLE_CLIENT_SECRET`에는 Apple이 요구하는 형식의 client secret 값을 넣습니다.
   이 값은 일반 비밀번호가 아니라 Apple 규칙에 맞춰 생성한 서명 토큰(JWT)입니다.
6. Apple callback이 `POST`로 들어오므로, 현재 코드처럼 callback route가 `POST`를 처리해야 정상 동작합니다.

주의:

- Apple은 `response_mode=form_post`를 사용하므로 query string만 가정하면 안 됩니다. 현재 코드는 `GET`과 `POST`를 둘 다 처리합니다.
- Apple 웹 로그인은 공개 HTTPS 도메인 기준 준비가 필요합니다. 로컬 `localhost`만으로 운영 수준 검증을 끝내는 방식은 권장하지 않습니다.
- Apple client secret은 만료 정책을 두고 다시 생성해야 할 수 있으니, 발급 절차와 만료일을 운영 문서에도 남겨 두는 편이 좋습니다.

공식 참고:

- https://developer.apple.com/documentation/signinwithapple/configuring-your-webpage-for-sign-in-with-apple
- https://developer.apple.com/documentation/signinwithapple/generate-and-validate-tokens

## 로컬 개발과 테스트

로컬에서는 아래 두 방식으로 나눠 보는 것이 현실적입니다.

### 1. 빠른 UI/플로우 테스트

```env
MOCK_OAUTH_PROVIDER=true
```

- Playwright와 로컬 수동 점검에 가장 안정적입니다.
- 공급자 콘솔 설정 없이도 로그인 버튼, redirect, callback, 세션 쿠키 흐름을 확인할 수 있습니다.
- 현재 테스트 설정도 이 방식을 사용합니다.

### 2. 실제 공급자 계정으로 검증

- Google, Kakao는 `localhost:4010` callback을 콘솔에 등록하면 비교적 쉽게 검증할 수 있습니다.
- Apple은 공개 HTTPS URL을 잡고 확인하는 편이 맞습니다.
- 실제 계정 검증 시에는 `MOCK_OAUTH_PROVIDER=false`로 돌려야 합니다.

## 운영 반영 체크리스트

- `NEXT_PUBLIC_APP_ORIGIN`이 실제 배포 도메인과 일치하는가
- 각 공급자 콜백 URL이 운영 도메인 기준으로 등록되었는가
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`이 들어갔는가
- `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET`이 들어갔는가
- `APPLE_CLIENT_ID`, `APPLE_CLIENT_SECRET`이 들어갔는가
- `MOCK_OAUTH_PROVIDER=false`인가
- 배포 후 `/auth`에서 각 버튼이 공급자 화면으로 이동하는가
- callback 이후 `/account` 또는 전달한 `next` 경로로 복귀하는가
- 세션 쿠키가 설정되어 로그인 상태가 유지되는가

## 자주 놓치는 점

- `NEXT_PUBLIC_APP_ORIGIN`이 비어 있으면 로컬 dev/test 브라우저 외 환경에서 public URL 생성이 실패할 수 있습니다.
- `npm run start`는 기존 `.next` 산출물을 보기 때문에, 인증 화면이나 auth route를 바꾼 뒤에는 `npm run build`를 다시 해야 최신 동작이 반영됩니다.
- provider 콘솔에 등록한 redirect URI와 코드에서 만든 callback URL이 한 글자라도 다르면 로그인 완료 직전에 실패합니다.
- Apple client secret은 단순 문자열이 아니라 운영 주기가 있는 값입니다.
- 운영에서는 mock 값을 켜 둔 채 배포하지 않도록 확인해야 합니다.
