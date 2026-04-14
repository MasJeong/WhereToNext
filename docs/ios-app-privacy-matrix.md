# 한눈에 보기

- 이 문서는 App Store Connect의 `App Privacy` 질문에 답할 때 바로 옮겨 적을 수 있도록 현재 코드 기준 데이터 수집 항목을 정리한 표다.
- 2026-04-10 기준 `떠나볼까?`는 로그인, 저장한 추천, 여행 기록, 소셜 로그인 공급자 정보가 핵심 사용자 데이터다.
- 지도, 영상, 이미지, 소셜 로그인은 외부 서비스와 함께 동작하므로 Apple 질문에서는 자사 코드뿐 아니라 서드파티 처리도 함께 확인해야 한다.
- `Capacitor`는 Apple의 third-party SDK requirement 목록에 포함돼 있으므로, App Privacy 입력 전 Xcode `Privacy Report`에서 SDK manifest가 실제 archive 결과에 포함되는지 확인하는 편이 안전하다.

# App Privacy 초안

## 계정 정보

- 데이터 유형: 이름, 이메일 주소, 사용자 식별자
- 수집 시점: 회원가입, 소셜 로그인, 세션 유지
- 목적: 계정 생성, 로그인 유지, 저장한 추천/기록 연결
- 연결 여부: 사용자 계정과 연결됨
- 추적 여부: 현재 코드 기준 광고 추적 용도는 아님

## 사용자 콘텐츠

- 데이터 유형: 여행 기록, 메모, 업로드 이미지, 저장한 추천, 앞으로 갈 곳
- 수집 시점: 사용자가 직접 저장하거나 기록을 남길 때
- 목적: 사용자에게 저장 결과와 여행 기록을 다시 보여 주기 위해
- 연결 여부: 사용자 계정과 연결됨
- 추적 여부: 아님

## 사용 데이터

- 데이터 유형: 추천 질의 조건, 복원용 snapshot 사용
- 수집 시점: 추천 생성, 링크 복원, 비교 페이지 열기
- 목적: 추천 결과 생성, 저장 결과 복원, 비교 흐름 제공
- 연결 여부: 비로그인 추천은 직접 계정과 연결되지 않을 수 있음
- 추적 여부: 아님

## 외부 서비스 관련 메모

- Apple / Google / Kakao 로그인: 계정 인증용
- Google Maps: 지도 렌더링과 위치 정보 보조
- YouTube: 목적지 관련 영상 보조 정보
- Unsplash: 목적지 이미지

## App Store Connect에서 다시 확인할 것

1. Apple 질문은 우리 코드뿐 아니라 서드파티 SDK/서비스 처리도 포함하는지 다시 확인
2. 광고 추적, 서드파티 광고 SDK, IDFA 사용이 없다는 점 재확인
3. `데이터가 사용자와 연결되는지`, `추적에 쓰는지` 질문을 항목별로 나눠 입력
4. archive 후 Xcode `Privacy Report`에서 Capacitor/Cordova 관련 항목이 누락되지 않는지 확인

# 코드 근거

- 개인정보처리방침: `src/app/privacy/page.tsx`
- 계정 삭제 API: `src/app/api/me/account/route.ts`
- 소셜 로그인 시작/콜백: `src/app/api/auth/oauth/[provider]/start/route.ts`, `src/app/api/auth/oauth/[provider]/callback/route.ts`
- 여행 기록/저장 API: `src/app/api/me/history/route.ts`, `src/app/api/me/snapshots/route.ts`
- 소셜/지도/영상 관련 env: `.env.example`
