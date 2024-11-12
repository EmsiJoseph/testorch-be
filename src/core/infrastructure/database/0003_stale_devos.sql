ALTER TABLE "project" DROP CONSTRAINT "project_team_id_team_id_fk";
--> statement-breakpoint
ALTER TABLE "project" DROP CONSTRAINT "project_created_by_user_id_fk";
--> statement-breakpoint
ALTER TABLE "team_members" DROP CONSTRAINT "team_members_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "team_members" DROP CONSTRAINT "team_members_team_id_team_id_fk";
--> statement-breakpoint
ALTER TABLE "test_plan" DROP CONSTRAINT "test_plan_project_id_project_id_fk";
--> statement-breakpoint
ALTER TABLE "test_plan" DROP CONSTRAINT "test_plan_created_by_user_id_fk";
--> statement-breakpoint
ALTER TABLE "project" ALTER COLUMN "team_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "project" ALTER COLUMN "created_by" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "team" ALTER COLUMN "id" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "team" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "test_plan" ALTER COLUMN "project_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "test_plan" ALTER COLUMN "created_by" SET NOT NULL;