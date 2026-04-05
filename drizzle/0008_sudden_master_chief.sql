ALTER TABLE "user_destination_history" RENAME COLUMN "image" TO "images";--> statement-breakpoint
ALTER TABLE "user_destination_history" ADD COLUMN "custom_tags" jsonb DEFAULT '[]'::jsonb NOT NULL;
