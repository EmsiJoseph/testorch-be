import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const teamRoleEnum = pgEnum('role', ['admin', 'member', 'observer']);

export const users = pgTable(
  'user',
  {
    id: text('id').primaryKey().notNull(),
    auth0_id: varchar('auth0_id').notNull(), // Auth0 ID
    first_name: varchar('first_name', { length: 255 }).notNull(),
    last_name: varchar('last_name', { length: 255 }).notNull(),
    email: varchar('email').notNull(),
    // Removed password_hash as it's managed by Auth0
  },
  (users) => {
    return {
      uniqueIdx: uniqueIndex('unique_idx').on(users.email),
    };
  },
);

export const sessions = pgTable('session', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  expiresAt: timestamp('expires_at').notNull(),
});

export const teams = pgTable('team', {
  id: text('id').primaryKey().notNull(),
  auth0_org_id: varchar('auth0_org_id').notNull(), // Auth0 Organization ID
  name: varchar('name').notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at')
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

// Many-to-many relationship between users and teams, with the team role
export const teamMembers = pgTable('team_members', {
  user_id: text('user_id').notNull(),
  team_id: uuid('team_id').notNull(),
  role: teamRoleEnum('role').notNull(), // Role of the user in the team
  created_at: timestamp('created_at').defaultNow(),
  update_at: timestamp('updated_at')
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

export const projects = pgTable('project', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name').notNull(), // Project name
  description: varchar('description'), // Optional description
  team_id: uuid('team_id').notNull(), // Project can belong to a team
  created_by: text('created_by').notNull(), // The user who created the project
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at')
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

export const testPlans = pgTable('test_plan', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name').notNull(), // Name of the test plan
  description: varchar('description'), // Optional description of the test plan
  location: varchar('location').notNull(), // Git link for the test plan content
  type: varchar('type').notNull(), // Type of the test plan
  project_name: varchar('project_name').notNull(), // Test plan belongs to a project
  created_by: text('created_by').notNull(), // User who created the test plan
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at')
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

export const grafanaCredentials = pgTable('grafana_credentials', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: varchar('username').notNull(),
  password: varchar('password').notNull(),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at')
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

export const influxdbCredentials = pgTable('influxdb_credentials', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: varchar('username').notNull(),
  password: varchar('password').notNull(),
  token: text('token').notNull(),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at')
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

// team_activities table