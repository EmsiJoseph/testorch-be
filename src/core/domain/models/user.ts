import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from '../../infrastructure/database/schema';

export const UserInsertSchema = createInsertSchema(users, {
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
});

export const UserSelectSchema = createSelectSchema(users);

export type UserInsertType = z.infer<typeof UserInsertSchema>;
export type UserSelectType = z.infer<typeof UserSelectSchema>;