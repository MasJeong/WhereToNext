## Verification

- Passed:
  - `npm run lint`

- Failed:
  - `npx vitest run tests/unit/smoke.spec.tsx`
    - Existing failure: the test still expects the old landing heading copy (`여행지, 감으로 시작해도 결과는 또렷하게.`), while the current UI renders `지금 맞는 여행지, 바로 좁혀 드려요.`

## Notes

- Existing repo state already had a smoke test mismatch around the home landing heading copy before this palette refresh.
- Full build verification can also be affected locally by blocked Google Fonts fetches in sandboxed/offline environments.
