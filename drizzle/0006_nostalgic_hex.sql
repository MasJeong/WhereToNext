CREATE TABLE "user_future_trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"destination_id" text NOT NULL,
	"source_snapshot_id" uuid NOT NULL,
	"destination_name_ko" text NOT NULL,
	"country_code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_future_trips" ADD CONSTRAINT "user_future_trips_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_future_trips" ADD CONSTRAINT "user_future_trips_destination_id_destination_profiles_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destination_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_future_trips_user_destination_unique" ON "user_future_trips" USING btree ("user_id","destination_id");