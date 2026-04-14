CREATE TYPE "public"."history_visibility" AS ENUM('public', 'private');--> statement-breakpoint
CREATE TABLE "community_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"history_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_destination_history" ADD COLUMN "visibility" "history_visibility" DEFAULT 'private' NOT NULL;--> statement-breakpoint
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_history_id_user_destination_history_id_fk" FOREIGN KEY ("history_id") REFERENCES "public"."user_destination_history"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;