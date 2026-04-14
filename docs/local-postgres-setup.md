# 로컬 Postgres 셋업

이 문서는 이 저장소를 `Postgres` 모드로 로컬에서 띄우기 위한 최소 절차와,
현재 `trip_compass` DB에 실제로 생성된 스키마를 정리한 운영 메모입니다.

## 현재 로컬 기준값

- DB URL: `postgres://postgres:postgres@127.0.0.1:5432/trip_compass`
- DB user: `postgres`
- DB password: `postgres`
- DB name: `trip_compass`
- Port: `5432`

## Windows 적용 기록

Windows에서는 EDB installer 대신 공식 Windows binaries zip을 풀어서 로컬 인스턴스를 만들었습니다.

- 바이너리 경로: `C:\Users\unfine\pgsql\17\pgsql\bin`
- 데이터 디렉터리: `C:\Users\unfine\pgsql\data-trip-compass`
- 서버 로그: `C:\Users\unfine\pgsql\trip-compass-postgres.log`

초기화에 사용한 핵심 명령:

```powershell
$bin = "C:\Users\unfine\pgsql\17\pgsql\bin"
$data = "C:\Users\unfine\pgsql\data-trip-compass"

Set-Content C:\Users\unfine\pgsql\postgres.pw "postgres" -NoNewline
& "$bin\initdb.exe" -D $data -U postgres -A scram-sha-256 --pwfile=C:\Users\unfine\pgsql\postgres.pw --encoding=UTF8 --locale=C
& "$bin\pg_ctl.exe" -D $data -l C:\Users\unfine\pgsql\trip-compass-postgres.log -o "-p 5432" start
$env:PGPASSWORD = "postgres"
& "$bin\createdb.exe" -h 127.0.0.1 -p 5432 -U postgres trip_compass
```

서버 시작/정지:

```powershell
$bin = "C:\Users\unfine\pgsql\17\pgsql\bin"
$data = "C:\Users\unfine\pgsql\data-trip-compass"

& "$bin\pg_ctl.exe" -D $data -l C:\Users\unfine\pgsql\trip-compass-postgres.log -o "-p 5432" start
& "$bin\pg_ctl.exe" -D $data stop
```

## macOS 적용 절차

macOS에서는 Homebrew 기준으로 같은 연결값을 맞추는 편이 가장 단순합니다.

설치:

```bash
brew install postgresql@17
brew services start postgresql@17
```

DB 생성:

```bash
createdb trip_compass
psql -d postgres -c "ALTER USER postgres WITH PASSWORD 'postgres';"
```

만약 로컬 기본 슈퍼유저가 `postgres`가 아니라 현재 macOS 계정명이라면:

```bash
createuser -s postgres
psql -d postgres -c "ALTER USER postgres WITH PASSWORD 'postgres';"
createdb -O postgres trip_compass
```

## DDL 적용

이 저장소의 DDL은 `drizzle/*.sql` migration입니다.

적용:

```bash
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/trip_compass npx drizzle-kit migrate
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/trip_compass npm run db:seed
```

검증:

```bash
psql postgres://postgres:postgres@127.0.0.1:5432/trip_compass -c "\dt public.*"
psql postgres://postgres:postgres@127.0.0.1:5432/trip_compass -c "\dT+ public.*"
```

## 생성된 public 테이블

- `account`
  columns: `id, account_id, provider_id, user_id, access_token, refresh_token, id_token, access_token_expires_at, refresh_token_expires_at, scope, password, created_at, updated_at, provider_email, provider_email_verified, last_login_at`
- `destination_affiliate_clicks`
  columns: `id, destination_id, partner, category, page_type, departure_airport, travel_month, trip_length_days, flight_tolerance, user_id, session_id, clicked_at`
- `destination_profiles`
  columns: `id, slug, kind, country_code, name_ko, name_en, budget_band, flight_band, best_months, pace_tags, vibe_tags, summary, watch_outs, active, created_at, updated_at`
- `destination_travel_supplement_cache`
  columns: `cache_key, destination_id, travel_month, payload, expires_at, created_at, updated_at`
- `recommendation_snapshots`
  columns: `id, kind, snapshot_version, query, payload, scoring_version_id, trend_snapshot_ids, destination_ids, created_at, visibility, owner_user_id`
- `scoring_versions`
  columns: `id, label, active, weights, tie_breaker_cap, shoulder_window_months, created_at`
- `session`
  columns: `id, expires_at, token, created_at, updated_at, ip_address, user_agent, user_id, client_type, last_seen_at, absolute_expires_at`
- `trend_snapshots`
  columns: `id, destination_id, tier, source_type, source_label, source_url, observed_at, freshness_state, confidence, summary, payload, created_at`
- `user`
  columns: `id, name, email, email_verified, image, created_at, updated_at, status, last_login_at`
- `user_destination_history`
  columns: `id, user_id, destination_id, rating, tags, would_revisit, visited_at, created_at, updated_at, memo, images, custom_tags`
- `user_future_trips`
  columns: `id, user_id, destination_id, source_snapshot_id, destination_name_ko, country_code, created_at, updated_at`
- `user_preference_profiles`
  columns: `user_id, exploration_preference, created_at, updated_at`
- `verification`
  columns: `id, identifier, value, expires_at, created_at, updated_at`

## 생성된 public enum

- `affiliate_category`: `flight`
- `affiliate_page_type`: `destination-detail`
- `affiliate_partner`: `skyscanner`, `trip-com`
- `budget_band`: `budget`, `mid`, `premium`
- `destination_kind`: `country`, `region`, `city`
- `evidence_source_type`: `embed`, `partner_account`, `hashtag_capsule`, `editorial`
- `evidence_tier`: `green`, `yellow`, `fallback`
- `exploration_preference`: `repeat`, `balanced`, `discover`
- `flight_band`: `short`, `medium`, `long`
- `freshness_state`: `fresh`, `aging`, `stale`
- `pace`: `slow`, `balanced`, `packed`
- `snapshot_kind`: `recommendation`, `comparison`
- `snapshot_visibility`: `public`, `private`
- `user_status`: `active`, `inactive`
- `vibe`: `romance`, `food`, `nature`, `city`, `shopping`, `beach`, `nightlife`, `culture`, `family`, `luxury`, `desert`

## 현재 seed 상태

- `destination_profiles`: `74` rows
- `scoring_versions`: `1` row

