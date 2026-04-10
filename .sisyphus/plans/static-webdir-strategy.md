# 한눈에 보기

- iOS shell은 `apps/ios-shell`의 static export 결과를 `capacitor.config.ts`의 `webDir`로 연결한다.
- shell 지원 라우트는 `/`, `/destinations/[slug]`, `/restore`, `/compare`만 유지한다.
- 동적 snapshot path와 인증/계정 surface는 hosted web 기준으로 남겨 두고 shell에서는 query-param restore와 hosted API 호출만 사용한다.

# 전략

## 산출물 경로

- shell build 결과: `apps/ios-shell/out`
- Capacitor `webDir`: `apps/ios-shell/out`
- iOS copy 대상: `ios/App/App/public`

## 라우트 원칙

- static export 가능한 finite route만 shell에 넣는다.
- 무한 동적 path(`/s/[snapshotId]`, `/compare/[snapshotId]`)는 hosted web canonical URL로 유지한다.
- shell 복원은 `/restore?snapshotId=...`, `/compare?snapshotId=...`로 처리한다.

## 운영 원칙

- shell build가 되지 않으면 `cap sync ios`를 배포 기준으로 보지 않는다.
- shell mode는 `NEXT_PUBLIC_IOS_SHELL=true`와 `capacitor://localhost` origin 계약을 유지한다.
- auth/account/history는 shell 범위 밖으로 유지한다.
