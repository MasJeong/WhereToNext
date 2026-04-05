# 한눈에 보기

- ERD 문서는 실제 스키마와 마이그레이션 파일을 기준으로 작성했다.
- 추측으로 관계를 추가하지 않고, FK 여부를 문서에 명시했다.

## 검증

1. `src/lib/db/schema.ts` 확인
2. `drizzle/0000_cute_sabra.sql`부터 `drizzle/0008_sudden_master_chief.sql`까지 확인
3. 로컬 Postgres `trip_compass`의 실제 테이블 목록과 대조
