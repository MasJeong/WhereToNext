CREATE TYPE "public"."snapshot_visibility" AS ENUM('public', 'private');--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "provider_email" text;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "provider_email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "last_login_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "recommendation_snapshots" ADD COLUMN "visibility" "snapshot_visibility" DEFAULT 'public' NOT NULL;--> statement-breakpoint
ALTER TABLE "recommendation_snapshots" ADD COLUMN "owner_user_id" text;--> statement-breakpoint
ALTER TABLE "recommendation_snapshots" ADD CONSTRAINT "recommendation_snapshots_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "account_provider_account_unique" ON "account" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "account_user_provider_unique" ON "account" USING btree ("user_id","provider_id");