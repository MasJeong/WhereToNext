CREATE TABLE "destination_travel_supplement_cache" (
	"cache_key" text PRIMARY KEY NOT NULL,
	"destination_id" text NOT NULL,
	"travel_month" integer,
	"payload" jsonb NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "destination_travel_supplement_cache" ADD CONSTRAINT "destination_travel_supplement_cache_destination_id_destination_profiles_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destination_profiles"("id") ON DELETE cascade ON UPDATE no action;