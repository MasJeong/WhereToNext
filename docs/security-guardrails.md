# 한눈에 보기

- 목적: 기능 추가 및 수정 시 기본으로 확인해야 할 보안 기준 정리
- 적용 범위: 개발, 구축, 운영 전반
- 연결 구조: `.claude/skills/security-guard/SKILL.md` + `.opencode/plugins/security-guard.ts`

## 핵심 원칙

1. 입력은 항상 신뢰하지 않는다.
2. 인증과 인가는 분리해서 본다.
3. 민감 정보는 응답, 로그, 저장, 전송에서 모두 따로 검토한다.
4. 외부 API 실패는 기본 기능 전체 실패로 번지지 않게 한다.
5. 실패 시 안전한 방향으로 종료한다.

## 기능 추가 및 수정 시 필수 확인 항목

### 1) 사용자 입력 검증
- query, body, params, headers, cookies, searchParams, formData 검증 여부
- 허용 범위, 길이, 형식, enum, null 처리 확인
- 클라이언트 검증만 있고 서버 검증이 빠지지 않았는지 확인
- denylist보다 allowlist/계약 기반 검증 우선
- HTML / markdown / URL 렌더링이 있으면 sanitizer 적용 여부 확인

### 2) 인증 / 인가
- 로그인 여부 확인이 필요한 기능인지
- 본인 소유 리소스만 접근/수정/삭제 가능한지
- 관리자 권한이 필요한 경로인지
- 프론트 숨김만으로 권한을 처리하지 않는지
- 서버 액션 / route handler / mutation path에서 authz를 재확인하는지
- deny-by-default, 최소 권한, 객체 단위 소유권 체크 적용 여부

### 3) 민감 정보 노출
- 토큰, 세션 ID, API Key, 이메일, 위치, 내부 에러 상세가 응답/로그에 노출되지 않는지
- 서버 비밀이 클라이언트 번들에 포함되지 않는지
- raw DB row 대신 최소 DTO만 반환하는지
- 비밀번호를 평문 저장/비교하지 않고 해싱 기반으로 처리하는지

### 4) 대표 취약점 점검
- SQL Injection
- XSS
- CSRF
- SSRF
- Open Redirect
- 파일 업로드 처리 위험
- GET 요청으로 상태를 변경하지 않는지
- 인증 쿠키에 `Secure`, `HttpOnly`, `SameSite`가 적용되는지

### 5) 외부 API / 네트워크 호출
- timeout 존재 여부
- retry 정책 존재 여부
- fallback 존재 여부
- circuit breaker나 차단 전략 필요 여부
- quota/rate limit 초과 시 동작
- 실패 시 사용자 안내 방식
- retry는 idempotent 요청에만 적용하는지
- redirect 추종 / SSRF 가능성까지 같이 검토하는지
- 외부 API 호출을 트랜잭션 내부에서 직접 수행하지 않는지
- 긴 외부 호출로 DB lock이 과도하게 유지되지 않는지

### 6) 로그 / 운영 보안
- 개인정보, 쿠키, Authorization header, 토큰 로그 금지
- 환경 변수 누락 시 안전한 실패
- 보안 헤더 유지 여부
- 캐시가 민감 응답을 공유하지 않는지
- 로그 주입 방지 여부
- 비밀값 하드코딩 금지 및 회전 가능성
- 인증 실패 / 인가 실패 / validation 급증 / 외부 API 장애 모니터링 여부

### 7) API 공개 범위 판단
- 상태 변경 API와 사용자 데이터 API는 인증/인가가 필수인지
- 공개 API라면 왜 공개여야 하는지와 abuse 대응이 있는지

## 운영 방식

- 기능 추가 / 수정 요청으로 판단되면 `.opencode/plugins/security-guard.ts`가 `security-guard` 스킬 내용을 자동으로 프롬프트에 덧붙인다.
- 따라서 사용자가 따로 스킬명을 호출하지 않아도, 코드 변경 작업에서는 보안 점검 기준이 기본으로 적용된다.

## 참고 기준

- OWASP 계열 체크리스트
- 일반적인 웹 애플리케이션 입력 검증 / 인증 / 인가 / 민감정보 보호 원칙
- 외부 API 호출 시 timeout / retry / fallback 운영 원칙
- 쿠키 보안, CSP, Server Action 보안, 비밀 관리, 업로드 처리, redirect/SSRF 방어 원칙
