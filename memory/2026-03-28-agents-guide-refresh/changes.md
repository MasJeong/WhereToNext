# 한눈에 보기

- 루트 `AGENTS.md`를 한국어 중심의 저장소 운영 가이드로 재작성했다.
- 기존 내용의 핵심 규칙은 유지하면서 `.sisyphus` 내부 구조 설명과 실명령 기반 테스트 실행 예시를 더 명확히 적었다.

## 변경 파일

- `AGENTS.md`: 저장소 전역 에이전트 가이드를 한국어로 재구성하고, 명령어/타입/검증/UI/문서화 규칙을 정리했다.
- `memory/2026-03-28-agents-guide-refresh/plan.md`: 이번 작업의 계획을 기록했다.
- `memory/2026-03-28-agents-guide-refresh/changes.md`: 실제 변경 내역을 기록했다.

## 메모

- `.cursorrules`, `.cursor/rules/`, `.github/copilot-instructions.md`, 중첩 `AGENTS.md`는 현재 없음을 반영했다.
- `.sisyphus/plans/`, `.sisyphus/drafts/`, `.sisyphus/notepads/`, `.sisyphus/boulder.json`의 역할을 명시했다.
- Oracle 리뷰를 반영해 `memory/` 설명 문장을 자연스럽게 고치고, 규칙 파일 부재 서술을 조건형으로 완화했다.
- `test:smoke`가 실제로 실행하는 `tests/unit/smoke.spec.tsx`를 본문에 명시했다.
