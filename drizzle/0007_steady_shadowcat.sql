ALTER TABLE "session" ADD COLUMN "client_type" text;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "last_seen_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "absolute_expires_at" timestamp with time zone;
