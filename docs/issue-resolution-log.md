# SooGo Issue Resolution Log

이 문서는 반복해서 발생할 수 있는 문제와 검증된 해결 방법을 누적하는 운영 기록입니다.
AI와 사람이 다음 작업 전에 먼저 읽고, 이미 해결된 패턴을 재사용할 수 있도록 유지합니다.

## 기록 원칙

- 실제로 재현하거나 확인한 문제만 기록합니다.
- 추측이나 미확인 원인은 적지 않습니다.
- 해결 후에는 어떤 방식으로 검증했는지 함께 남깁니다.
- 같은 문제가 다시 발생하면 먼저 이 문서를 확인합니다.

## 작성 템플릿

```md
### YYYY-MM-DD - 짧은 이슈 제목
- Symptoms: 사용자가 본 현상 또는 에러 메시지
- Cause: 확인된 원인
- Resolution: 적용한 해결 방법
- Verification: 재현/테스트/빌드 등 확인 방법
- References: 관련 파일 경로
```

## Entries

### 2026-03-18 - 로컬 JSON 스토어 임시 파일 충돌
- Symptoms: 저장 복원과 비교 보드 흐름이 간헐적으로 실패하고, e2e에서 `LOCAL_STORE_PARSE_FAILED` 또는 `.tmp` 파일 관련 오류가 발생함.
- Cause: 로컬 JSON 스토어가 항상 같은 임시 파일명을 사용해서 동시 쓰기 시 충돌이 발생함.
- Resolution: 임시 파일명을 `randomUUID()` 기반으로 고유하게 만들고, 직렬 e2e 설정과 함께 사용함.
- Verification: `npm run test:e2e`, `npm run build`
- References: `src/lib/persistence/local-store.ts`, `playwright.config.ts`

### 2026-03-18 - Playwright가 오래된 3000 포트 서버를 재사용하는 문제
- Symptoms: 최신 코드가 아닌 이전 빌드/이전 개발 서버 기준으로 e2e가 실행되어 selector 또는 비교 보드 동작이 엇갈림.
- Cause: 3000 포트에 남아 있는 기존 프로세스와 `reuseExistingServer` 동작이 겹쳐 fresh server가 아닌 stale server를 보게 됨.
- Resolution: Playwright는 항상 새 서버를 띄우도록 설정하고, 검증 전에 3000 포트를 정리하는 운영 절차를 사용함.
- Verification: `npm run test:e2e`, 수동 `npm run start` + `curl http://localhost:3000`
- References: `playwright.config.ts`
