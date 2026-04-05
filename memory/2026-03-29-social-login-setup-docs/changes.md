# 한눈에 보기

- `docs/social-login-setup.md`를 새로 추가해 실제 소셜 로그인 설정 절차를 공급자별로 정리했다.
- `README.md`에서 새 문서 경로를 바로 찾을 수 있게 연결했다.

## 변경 내용

### 1. 공급자별 실제 설정 가이드 추가

- 코드가 요구하는 환경 변수 목록을 정리했다.
- Google, Kakao, Apple 각각의 authorize/token/callback 관점에서 필요한 콘솔 설정을 적었다.
- `NEXT_PUBLIC_APP_ORIGIN`과 callback URL 규칙을 명시했다.
- Apple의 `form_post` callback과 공개 HTTPS 도메인 준비 필요성을 분리해 설명했다.

### 2. 로컬과 운영 절차 분리

- `MOCK_OAUTH_PROVIDER=true`를 쓰는 빠른 로컬 검증 방법을 적었다.
- 실제 공급자 계정 검증은 `MOCK_OAUTH_PROVIDER=false`와 콘솔 callback 등록이 필요하다고 적었다.
- 운영 배포 체크리스트와 자주 놓치는 점을 별도 섹션으로 묶었다.

### 3. README 연결

- README 환경 변수/소셜 로그인 설명 구간에서 상세 설정 문서 경로를 안내했다.
