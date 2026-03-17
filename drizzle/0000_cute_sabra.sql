CREATE TYPE "public"."budget_band" AS ENUM('budget', 'mid', 'premium');--> statement-breakpoint
CREATE TYPE "public"."destination_kind" AS ENUM('country', 'region', 'city');--> statement-breakpoint
CREATE TYPE "public"."evidence_source_type" AS ENUM('embed', 'partner_account', 'hashtag_capsule', 'editorial');--> statement-breakpoint
CREATE TYPE "public"."evidence_tier" AS ENUM('green', 'yellow', 'fallback');--> statement-breakpoint
CREATE TYPE "public"."flight_band" AS ENUM('short', 'medium', 'long');--> statement-breakpoint
CREATE TYPE "public"."freshness_state" AS ENUM('fresh', 'aging', 'stale');--> statement-breakpoint
CREATE TYPE "public"."pace" AS ENUM('slow', 'balanced', 'packed');--> statement-breakpoint
CREATE TYPE "public"."snapshot_kind" AS ENUM('recommendation', 'comparison');--> statement-breakpoint
CREATE TYPE "public"."vibe" AS ENUM('romance', 'food', 'nature', 'city', 'shopping', 'beach', 'nightlife', 'culture', 'family', 'luxury', 'desert');--> statement-breakpoint
CREATE TABLE "destination_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"kind" "destination_kind" NOT NULL,
	"country_code" text NOT NULL,
	"name_ko" text NOT NULL,
	"name_en" text NOT NULL,
	"budget_band" "budget_band" NOT NULL,
	"flight_band" "flight_band" NOT NULL,
	"best_months" jsonb NOT NULL,
	"pace_tags" jsonb NOT NULL,
	"vibe_tags" jsonb NOT NULL,
	"summary" text NOT NULL,
	"watch_outs" jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "destination_profiles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "recommendation_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "snapshot_kind" NOT NULL,
	"snapshot_version" integer DEFAULT 1 NOT NULL,
	"query" jsonb NOT NULL,
	"payload" jsonb NOT NULL,
	"scoring_version_id" text,
	"trend_snapshot_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"destination_ids" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scoring_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"weights" jsonb NOT NULL,
	"tie_breaker_cap" integer NOT NULL,
	"shoulder_window_months" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trend_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"destination_id" text NOT NULL,
	"tier" "evidence_tier" NOT NULL,
	"source_type" "evidence_source_type" NOT NULL,
	"source_label" text NOT NULL,
	"source_url" text NOT NULL,
	"observed_at" timestamp with time zone NOT NULL,
	"freshness_state" "freshness_state" NOT NULL,
	"confidence" integer NOT NULL,
	"summary" text NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recommendation_snapshots" ADD CONSTRAINT "recommendation_snapshots_scoring_version_id_scoring_versions_id_fk" FOREIGN KEY ("scoring_version_id") REFERENCES "public"."scoring_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trend_snapshots" ADD CONSTRAINT "trend_snapshots_destination_id_destination_profiles_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destination_profiles"("id") ON DELETE no action ON UPDATE no action;