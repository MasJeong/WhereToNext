CREATE TYPE "public"."affiliate_category" AS ENUM('flight');--> statement-breakpoint
CREATE TYPE "public"."affiliate_page_type" AS ENUM('destination-detail');--> statement-breakpoint
CREATE TYPE "public"."affiliate_partner" AS ENUM('skyscanner', 'trip-com');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TABLE "destination_affiliate_clicks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"destination_id" text NOT NULL,
	"partner" "affiliate_partner" NOT NULL,
	"category" "affiliate_category" NOT NULL,
	"page_type" "affiliate_page_type" NOT NULL,
	"departure_airport" text,
	"travel_month" integer,
	"trip_length_days" integer,
	"flight_tolerance" text,
	"user_id" text,
	"session_id" text,
	"clicked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "status" "user_status" DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "last_login_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "destination_affiliate_clicks" ADD CONSTRAINT "destination_affiliate_clicks_destination_id_destination_profiles_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destination_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "destination_affiliate_clicks" ADD CONSTRAINT "destination_affiliate_clicks_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;