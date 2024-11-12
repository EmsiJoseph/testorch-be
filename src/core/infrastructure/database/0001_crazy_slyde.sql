ALTER TABLE "team" RENAME COLUMN "org_id" TO "auth0_org_id";--> statement-breakpoint
ALTER TABLE "team" ALTER COLUMN "auth0_org_id" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "team" ALTER COLUMN "auth0_org_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "auth0_id" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN IF EXISTS "password_hash";