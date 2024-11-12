import { createInsertSchema } from 'drizzle-zod';
import {
    grafanaCredentials,
    influxdbCredentials,
} from 'src/core/infrastructure/database/schema';
import { z } from 'zod';

export const GrafanaCredentialsInsertSchema =
  createInsertSchema(grafanaCredentials);

export const GrafanaCredentialsSelectSchema =
  createInsertSchema(grafanaCredentials);

export const InfluxDbCredentialsInsertSchema =
  createInsertSchema(influxdbCredentials);

export const InfluxDbCredentialsSelectSchema =
  createInsertSchema(influxdbCredentials);

export type GrafanaCredentialsInsertType = z.infer<
  typeof GrafanaCredentialsInsertSchema
>;
export type GrafanaCredentialsSelectType = z.infer<
  typeof GrafanaCredentialsSelectSchema
>;

export type InfluxDbCredentialsInsertType = z.infer<
  typeof InfluxDbCredentialsInsertSchema
>;

export type InfluxDbCredentialsSelectType = z.infer<
  typeof InfluxDbCredentialsSelectSchema
>;
