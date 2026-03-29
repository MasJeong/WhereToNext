# 한눈에 보기

- 코드와 공식 문서를 대조해 문서가 현재 구현과 맞는지 확인했다.
- Markdown 문서 렌더와 링크 연결을 정적 확인했다.

## 확인 항목

1. `src/lib/oauth-provider-service.ts`
- 공급자별 필수 env 이름과 authorize/token endpoint 확인

2. `src/app/api/auth/oauth/[provider]/start/route.ts`
- callback URL 생성 방식과 `next`, `intent` 전달 구조 확인

3. `src/app/api/auth/oauth/[provider]/callback/route.ts`
- Google/Kakao는 GET callback, Apple은 `form_post`를 고려한 POST callback까지 처리함을 확인

4. `src/lib/runtime/url.ts`
- `NEXT_PUBLIC_APP_ORIGIN` 필요 조건 확인

5. 공식 문서 대조
- Google OAuth web server flow
- Kakao Login REST API / prerequisite
- Sign in with Apple 웹 설정 / token 문서

## 실행한 확인 명령

```bash
sed -n '1,360p' src/lib/oauth-provider-service.ts
sed -n '1,260p' 'src/app/api/auth/oauth/[provider]/start/route.ts'
sed -n '1,340p' 'src/app/api/auth/oauth/[provider]/callback/route.ts'
sed -n '1,220p' .env.example
rg -n "OAUTH_ENV_MISSING|GOOGLE_CLIENT_ID|GOOGLE_CLIENT_SECRET|KAKAO_CLIENT_ID|KAKAO_CLIENT_SECRET|APPLE_CLIENT_ID|APPLE_CLIENT_SECRET|MOCK_OAUTH_PROVIDER|NEXT_PUBLIC_APP_ORIGIN" src tests README.md .env.example
```
