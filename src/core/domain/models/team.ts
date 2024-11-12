import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { teams } from '../../infrastructure/database/schema';

export const TeamInsertSchema = createInsertSchema(teams, {
  name: z.string().min(1, 'Team name is required'),
  auth0_org_id: z.string().min(1, 'Auth0 Organization ID is required'),
  description: z.string().optional(),
});

// For selecting (output) operations:
export const TeamSelectSchema = createSelectSchema(teams, {
  id: z.string(),
  name: z.string(),
  auth0_org_id: z.string(),
  description: z.string().optional(),
});

// Usage in a service or controller for validation
export type TeamInsertType = z.infer<typeof TeamInsertSchema>;
export type TeamSelectType = z.infer<typeof TeamSelectSchema>;
