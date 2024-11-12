import { Inject, Injectable, Logger } from '@nestjs/common';
import { desc } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE_ORM } from 'src/constants/db.constant';
import { DatabaseOperationError } from 'src/core/domain/errors/common';
import {
    GrafanaCredentialsSelectType,
    InfluxDbCredentialsSelectType,
} from 'src/core/domain/models/credentials';
import * as schema from '../database/schema';

@Injectable()
export class SetupService {
  constructor(
    @Inject(DRIZZLE_ORM) private conn: PostgresJsDatabase<typeof schema>,
  ) {}

  private logger = new Logger('SetupService');

  async storeGrafanaCredentials(
    userName: string,
    password: string,
  ): Promise<GrafanaCredentialsSelectType> {
    try {
      const query = this.conn
        .insert(schema.grafanaCredentials)
        .values({
          username: userName,
          password: password,
        })
        .returning();

      const credentials = await query.execute().then((result) => result[0]);

      if (!credentials) {
        throw new Error('Failed to create grafana credentials');
      }

      return credentials;
    } catch (error) {
      this.logger.error('Error creating grafana credentials:', error);
      throw new DatabaseOperationError(
        'Failed to create grafana credentials',
        error,
      );
    }
  }

  async getGrafanaCredentials(): Promise<GrafanaCredentialsSelectType> {
    try {
      const query = this.conn
        .select()
        .from(schema.grafanaCredentials)
        .orderBy(desc(schema.grafanaCredentials.created_at))
        .limit(1);

      const credentials = await query.execute().then((result) => result[0]);

      if (!credentials) {
        throw new Error('No grafana credentials found');
      }

      return credentials;
    } catch (error) {
      this.logger.error('Error fetching grafana credentials:', error);
      throw new DatabaseOperationError(
        'Failed to fetch grafana credentials',
        error,
      );
    }
  }

  async storeInfluxDbCredentials(
    userName: string,
    password: string,
    token: string,
  ): Promise<InfluxDbCredentialsSelectType> {
    try {
      const query = this.conn
        .insert(schema.influxdbCredentials)
        .values({
          username: userName,
          password: password,
          token: token,
        })
        .returning();

      const credentials = await query.execute().then((result) => result[0]);

      if (!credentials) {
        throw new Error('Failed to create InfluxDB credentials');
      }

      return credentials;
    } catch (error) {
      this.logger.error('Error creating InfluxDB credentials:', error);
      throw new DatabaseOperationError(
        'Failed to create InfluxDB credentials',
        error,
      );
    }
  }

  async getInfluxDbCredentials(): Promise<InfluxDbCredentialsSelectType> {
    try {
      const query = this.conn
        .select()
        .from(schema.influxdbCredentials)
        .orderBy(desc(schema.influxdbCredentials.created_at))
        .limit(1);

      const credentials = await query.execute().then((result) => result[0]);

      if (!credentials) {
        throw new Error('No InfluxDB credentials found');
      }

      return credentials;
    } catch (error) {
      this.logger.error('Error fetching InfluxDB credentials:', error);
      throw new DatabaseOperationError(
        'Failed to fetch InfluxDB credentials',
        error,
      );
    }
  }
}
