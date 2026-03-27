# Memory

이 폴더는 **중요하거나 큰 작업의 visible audit trail**을 남기는 공간입니다.

숨김 폴더인 `.sisyphus/`가 에이전트 내부 계획/메모를 담는다면, `memory/`는 사용자가 직접 확인할 수 있는 작업 기록을 담습니다.

## 언제 생성하나

다음 중 하나에 해당하면 새 폴더를 만듭니다.

- 여러 파일을 건드리는 작업
- 여러 단계의 계획/검증이 필요한 작업
- 구조, 정책, 아키텍처, UX 방향처럼 영향 범위가 큰 작업
- 사용자가 나중에 작업 내용을 직접 검토하길 기대하는 작업

작은 단일 파일 수정이나 사소한 문구 변경까지 강제하지는 않습니다.

## 폴더 규칙

- 경로: `memory/YYYY-MM-DD-short-slug/`
- 예시: `memory/2026-03-26-ios-shell-static-webdir/`

각 폴더에는 최소한 아래 3개 파일을 둡니다.

- `plan.md` — 작업 목표, 범위, 가정, 할 일
- `changes.md` — 실제로 바꾼 파일과 핵심 변경점
- `verification.md` — 실행한 검증 명령, 결과, 남은 리스크

## 파일 템플릿

### `plan.md`

```md
# <작업 제목>

## Goal
- 무엇을 끝내려는지

## Scope
- 포함 범위
- 제외 범위

## Plan
1. 첫 단계
2. 다음 단계

## Risks
- 확인이 필요한 부분
```

### `changes.md`

```md
# Changes

## Files
- `path/to/file.ts`: 무엇을 바꿨는지

## Notes
- 왜 이 방식으로 바꿨는지
```

### `verification.md`

```md
# Verification

## Commands
- `npm run lint`
- `npm run test:unit`

## Result
- pass/fail와 핵심 관찰 결과

## Open Risks
- 아직 남아 있는 제약이나 후속 작업
```

## 주의사항

- 비밀번호, 토큰, 인증정보를 넣지 않습니다.
- 불필요하게 큰 로그나 생성 산출물을 커밋하지 않습니다.
- `docs/issue-resolution-log.md`는 반복 이슈/해결책 기록용이고, `memory/`는 개별 큰 작업의 audit trail 용도입니다.
