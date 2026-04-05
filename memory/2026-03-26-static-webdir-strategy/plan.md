# 정적 WebDir 전략

## 목표
- 현재 호스팅 중인 Next.js 앱을 static-export 앱으로 바꾸지 않으면서, 향후 iOS Capacitor 패키징에 쓸 수 있는 사실 기반 정적 `webDir` 경로를 만든다.

## 범위
- `apps/ios-shell/` 보조 앱 scaffold
- shared shell-safe contract 추출
- `/`, `/destinations/[slug]`, `/restore`, `/compare`용 정적 shell route
- 지원하지 않는 흐름에 대한 hosted-web handoff 정책
- shell build/test/docs 및 Capacitor handoff 메모

## 제외 범위
- iOS shell 패키징과 무관한 루트 웹 UI 리디자인
- shell v1 내부의 auth/account/history 지원
- 이 작업 항목에서의 네이티브 Capacitor iOS scaffold, universal link, simulator 배포 증빙

## 작업 계획
1. `docs/` 아래에 이미 작성된 route scope matrix를 실제 앱 화면과 대조해 확인한다.
2. standalone static export 설정과 build script를 갖춘 `apps/ios-shell/`을 scaffold한다.
3. shell app이 server-only import 없이 UI와 계약을 재사용할 수 있도록 shell-safe 경계를 추출한다.
4. home, destination detail, restore, compare용 shell route를 구현한다.
5. unsupported route handoff 동작, shell 검증, 패키징 문서를 추가한다.
6. 계획 준비 완료로 판단하기 전에 전체 검증과 리뷰 단계를 수행한다.

## 리스크
- shared component가 전이적으로 server-only module을 import하고 있을 수 있다.
- Next.js static export 제약 때문에 route/search param 사용 경계를 다시 잡아야 할 수 있다.
- shell 전용 entrypoint를 도입하면서도 현재 hosted web 동작은 그대로 보존해야 한다.
