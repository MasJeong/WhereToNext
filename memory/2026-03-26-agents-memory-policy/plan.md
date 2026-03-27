# AGENTS memory policy

## Goal
- 중요한 작업이 hidden scratch space에만 남지 않도록 visible audit trail 규칙을 추가한다.

## Scope
- `AGENTS.md`에 major work용 `memory/` 규칙 추가
- `memory/README.md`로 폴더 목적과 사용법 문서화
- 이번 변경 자체에 대한 sample audit trail 생성

## Out of Scope
- 기존 모든 과거 작업에 대해 `memory/` 폴더를 소급 생성하는 작업
- 빌드/런타임 동작 변경

## Plan
1. 현재 `AGENTS.md`와 기존 문서 역할을 확인한다.
2. `memory/` 규칙을 `AGENTS.md`에 추가한다.
3. `memory/README.md`와 현재 작업용 샘플 폴더를 만든다.
4. 변경 내용을 읽어 규칙 충돌이 없는지 검증한다.

## Risks
- `docs/issue-resolution-log.md`와 역할이 겹쳐 보일 수 있으므로 차이를 명확히 적어야 한다.
- 너무 넓은 규칙이 되면 작은 작업에도 불필요한 문서가 생길 수 있다.
