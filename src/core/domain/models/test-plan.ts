import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { testPlans } from '../../infrastructure/database/schema';

export const TestPlanInsertSchema = createInsertSchema(testPlans, {});

// For selecting (output) operations:
export const TestPlanSelectSchema = createSelectSchema(testPlans, {});

// Usage in a service or controller for validation
export type TestPlanInsertType = z.infer<typeof TestPlanInsertSchema>;
export type TestPlanSelectType = z.infer<typeof TestPlanSelectSchema>;

