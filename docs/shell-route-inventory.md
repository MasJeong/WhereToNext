# 떠나볼래 라우트 인벤토리, Shell v1 범위

이 문서는 떠나볼래 앱의 모든 사용자-facing 라우트를 분류하고, iOS Shell v1에서 어떤 라우트가 지원되는지 정의합니다.

## 분류 기준

| 분류 | 의미 |
|------|------|
| **Shell v1 지원** | 동반 정적 shell 앱(`apps/ios-shell/`)에서 정적 내보내기(export)가 가능하고, Capacitor 패키징 대상이 되는 라우트 |
| **호스팅 웹 전용** | 기준 hosted web(`src/app/`)에서만 동작하며, shell app에서는 정적 내보내기 대상이 아닌 라우트. Shell app에서 접근하면 hosted web으로 넘긴다 |
| **제외** | Shell v1 범위에서 의도적으로 제외한 라우트. Shell app에서 접근하면 hosted web 사용을 안내한다 |

## 라우트 인벤토리 매트릭스

### Shell v1 지원 라우트

| 라우트 | 정적 내보내기 방식 | 설명 |
|--------|-------------------|------|
| `/` | `output: "export"` 정적 HTML | 익명 추천 홈 페이지. `HomeExperience` + `ExperienceShell` 재사용 |
| `/destinations/[slug]` | `generateStaticParams()` + finite slug list | 목적지 상세 페이지. `launch-catalog.ts`의 repo-owned 슬러그만 사용 |
| `/restore` | 정적 HTML + client-side `snapshotId` query param | 스냅샷 복원 페이지. API에서 런타임 데이터 Fetch |
| `/compare` | 정적 HTML + client-side `snapshotId` query param | 비교 스냅샷 복원 페이지. API에서 런타임 데이터 Fetch |

### Hosted-web 전용 라우트

| 라우트 | 이유 |
|--------|------|
| `/s/[snapshotId]` | 동적 라우트. snapshot ID가 무한하고 예측 불가능하므로 `generateStaticParams()`로 내보내기 불가. Canonical 저장 링크로 hosted web에서만 동작 |
| `/compare/[snapshotId]` | 동적 라우트. snapshot ID가 무한하고 예측 불가능하므로 `generateStaticParams()`로 내보내기 불가. Canonical 비교 링크로 hosted web에서만 동작 |

### 제외 라우트

| 라우트 | 이유 |
|--------|------|
| `/auth` | 인증/세션 의존적. 쿠키, 세션 서버 사이드 검증 필요. Shell v1 범위(익명 acquisition only) 밖 |
| `/account` | 계정 관리. 인증/세션 의존적. Shell v1 범위 밖 |
| `/api/me/*` | 사용자 선호/히스토리 API. 인증/세션 의존적이며 shell v1 범위 밖 |
| `/api/*` | API 라우트 핸들러는 shell app이 정적 export 대상으로 갖지 않는다. Shell app은 hosted web API를 호출만 하고 생성하지 않음 |
| `/history` | 현재 top-level page route는 없지만, 방문 이력 의미의 기능은 `/account` 및 `/api/me/history/*`와 함께 shell v1 범위 밖으로 유지 |

## Shell v1 URL 규약

Shell app에서 URL을 만들 때는 다음 규칙을 따릅니다.

```typescript
// src/lib/runtime/url.ts

// 정식 공개 URL (hosted web용)
buildPublicUrl('/s/snapshot123')     // → https://tteonabolrae.example.com/s/snapshot123
buildPublicUrl('/compare/snap123')   // → https://tteonabolrae.example.com/compare/snap123

// Shell app 내부 라우팅
// - snapshotId는 query parameter로 전달: /restore?snapshotId=snapshot123
// - canonical URL은 hosted web으로 연결
```

## 아키텍처 결정 기록

### Shell app route 이름과 canonical URL 구분

**의도적인 설계:**
- Shell app의 snapshot 복원 라우트: `/restore` (query param 방식)
- Canonical 저장 링크: `/s/[snapshotId]` (path param 방식, hosted web only)

이 분리는 아래 사항을 보장합니다.
1. Shell app은 동적 snapshot ID를 경로에 가지지 않으므로 `output: "export"` 호환
2. Canonical URL은 변경되지 않으며 hosted web의 기준 경로(source of truth)로 유지
3. 사용자가 shell에서 snapshot 링크를 공유하면 → canonical `/s/[snapshotId]` URL 공유 (hosted web으로 유도)

### Static export 호환성

Shell app에서 `output: "export"`가 가능한 이유는 다음과 같습니다.
- `/` — 정적 HTML, 런타임 API 호출은 client-side fetch
- `/destinations/[slug]` — `generateStaticParams()`로 finite slug만 export
- `/restore`, `/compare` — 정적 HTML, snapshotId는 query param으로 client-side fetch

## 관련 문서

- 아키텍처 결정: `.sisyphus/plans/static-webdir-strategy.md`
- iOS 출시 체크리스트: `docs/ios-release-preflight.md`
- iOS 실행 계획: `.sisyphus/plans/ios-launch-path.md`

## 현재 앱 표면 검증 메모

현재 `src/app/**/page.tsx` 기준 top-level user-facing page route는 다음 6개다.

- `/`
- `/destinations/[slug]`
- `/s/[snapshotId]`
- `/compare/[snapshotId]`
- `/auth`
- `/account`

위 6개는 모두 이 문서에서 정확히 한 번씩 분류된다. 별도 top-level `/history` page는 없지만, history 기능은 account/API surface에 묶여 있어 shell v1 범위에서 제외로 유지한다.
