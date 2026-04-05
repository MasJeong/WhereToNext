# 한눈에 보기

- account delete route / UI unit, lint, build, shell build를 확인했다.
- 남은 blocker는 App Privacy metadata와 Capacitor/iOS scaffold다.

# 검증

## 명령
- `npx vitest run tests/unit/api/me-account-route.spec.ts`
- `npx vitest run tests/unit/ui/account-future-trips.spec.tsx`
- `npm run lint`
- `npm run build`
- `npm run shell:build`

## 결과
- `tests/unit/api/me-account-route.spec.ts`: 통과
- `tests/unit/ui/account-future-trips.spec.tsx`: 통과
- `npm run lint`: 통과
- `npm run build`: 통과
- `npm run shell:build`: 통과, `apps/ios-shell/out` 생성 확인

## 남은 리스크
- App Store Connect `App Privacy`, `Age Rating`, `export compliance`, `review notes`는 아직 별도 정리와 입력이 필요하다.
- `capacitor.config.ts`, `ios/App/**`, Xcode simulator/TestFlight 증빙은 아직 없다.
