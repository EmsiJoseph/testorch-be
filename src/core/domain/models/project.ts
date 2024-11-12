import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { projects } from '../../infrastructure/database/schema';

export const ProjectInsertSchema = createInsertSchema(projects, {
  name: z.string().min(1, 'Team name is required'),
  team_id: z.string().min(1, 'Auth0 Organization ID is required'),
  description: z.string().optional(),
});
export const ProjectSelectSchema = createSelectSchema(projects);

export type ProjectInsertType = z.infer<typeof ProjectInsertSchema>;
export type ProjectSelectType = z.infer<typeof ProjectSelectSchema>;


// export interface IProjectsWithRecentTests {}