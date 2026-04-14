# 한눈에 보기

- 이 문서는 집에 가서 Mac 앞에서 바로 따라 할 마지막 iOS 배포 순서다.
- 로컬 코드 기준으로 이미 끝난 것은 `shell:build`, `cap sync ios`, 정책/지원 페이지, 제출 초안 문서 준비다.
- 남은 건 Xcode와 App Store Connect 입력뿐이다.

# 출발 전 확인

1. 최신 브랜치 받기: `feature/ios-release-prep`
2. 이 문서와 [docs/ios-app-store-connect-submission-pack.md](C:/jihun_roject/trip-compass/docs/ios-app-store-connect-submission-pack.md), [docs/ios-app-privacy-matrix.md](C:/jihun_roject/trip-compass/docs/ios-app-privacy-matrix.md)를 옆에 띄워 둔다.
3. 운영 도메인을 확정하고 아래 URL을 실제 값으로 바꿔 메모해 둔다.
   - `https://<운영도메인>/privacy`
   - `https://<운영도메인>/support`
4. `Xcode 26` 이상 설치 여부를 먼저 확인한다.

# Mac에서 할 일

## 1. 최신 shell 동기화

1. `npm run shell:build`
2. `npx cap sync ios`

## 2. Xcode signing

1. `ios/App/App.xcodeproj` 열기
2. `App` target 선택
3. `Signing & Capabilities`에서 `Team` 지정
4. Bundle ID 확인
5. 버전 `1.0`, build `1` 확인
6. archive 전에 `Privacy Report`에서 Capacitor manifest가 보이는지 확인

## 3. 기기 smoke 확인

1. 홈 진입
2. 추천 질문 진행
3. 추천 결과 확인
4. 목적지 상세 확인
5. `/privacy`, `/support` 진입 확인

## 4. Archive / Upload

1. `Product > Archive`
2. Organizer 열리면 `Distribute App`
3. `App Store Connect > Upload`
4. 처리 완료까지 대기

# App Store Connect에서 할 일

## 1. 앱 정보

- 배포 국가가 `대한민국`만 선택돼 있는지
- App Store Connect에 `DSA trader status` 관련 질문지가 보이면 한국 한정 배포 기준으로 처리했는지
- Privacy Policy URL
- Support URL
- Age Rating
- Export Compliance

## 2. App Privacy

- [docs/ios-app-privacy-matrix.md](C:/jihun_roject/trip-compass/docs/ios-app-privacy-matrix.md) 기준으로 입력

## 3. App Review Information

- 연락처 이름
- 연락처 이메일
- 연락처 전화번호
- Review notes

## 4. 스크린샷

1. 홈
2. 질문 흐름
3. 결과 화면
4. 목적지 상세
5. 정책 또는 지원 화면

# 마지막 체크

1. TestFlight 빌드 처리 완료 확인
2. 내부 테스터 추가
3. TestFlight 설치 후 실제 기기에서 한 번 더 열기
4. 필요하면 그다음 심사 제출
