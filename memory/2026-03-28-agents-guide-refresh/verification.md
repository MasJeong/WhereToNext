# 한눈에 보기

- 상태: 완료
- 검증 범위: 문서 경로, 요구 사항 반영 여부, diff 확인, Oracle 리뷰

## 수행한 확인

1. 루트 `AGENTS.md`를 다시 읽어 한국어 문서화, 단일 테스트 명령, `.sisyphus`와 `memory` 설명이 반영됐는지 확인했다.
2. `git diff --stat`로 실제 변경 범위를 확인했다.
3. Oracle 리뷰를 받아 문서 정확성과 과한 단정 표현 여부를 점검했다.

## 결과

- `AGENTS.md`는 저장소 실제 스크립트와 테스트 설정(`package.json`, `vitest.config.ts`, `playwright.config.ts`)에 맞게 정리됐다.
- `.cursorrules`, `.cursor/rules/`, `.github/copilot-instructions.md`, 중첩 `AGENTS.md`는 현재 발견되지 않았다는 형태로 문장을 완화했다.
- `memory/` 설명의 어색한 문장을 수정했고, `test:smoke`가 실행하는 `tests/unit/smoke.spec.tsx`를 명시했다.
- 이번 변경은 문서 작업이라 lint/test/build 같은 런타임 검증 대상은 아니며, 파일 재독과 Oracle 리뷰로 검증했다.

## 참고

- Oracle 결론: 큰 수정 없이 사용 가능하며, 문장 표현 2곳과 smoke 설명 1곳 보강 권고.
