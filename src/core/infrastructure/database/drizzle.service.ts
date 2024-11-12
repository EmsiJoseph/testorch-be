import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  drizzle as drizzlePgJs,
  PostgresJsDatabase,
} from 'drizzle-orm/postgres-js';
import { migrate as migratePgJs } from 'drizzle-orm/postgres-js/migrator';
import * as postgres from 'postgres';
import { DatabaseOperationError } from 'src/core/domain/errors/common';
import {
  NEST_DRIZZLE_OPTIONS
} from '../../../constants/db.constant';
import {
  IDrizzleService,
  NestDrizzleOptions,
} from '../../application/interfaces/services/drizzle.interfaces';

@Injectable()
export class DrizzleService implements IDrizzleService {
  private _drizzle: PostgresJsDatabase<Record<string, unknown>>;

  constructor(
    @Inject(NEST_DRIZZLE_OPTIONS)
    private _NestDrizzleOptions: NestDrizzleOptions,
  ) {}

  private logger = new Logger('DrizzleService');

  public handlePostgresError(error: any, entity: string): never {
    switch (error.code) {
      case '23505':
        throw new DatabaseOperationError(`${entity} already exists.`);
      case '23502':
        throw new DatabaseOperationError(
          `Missing required fields in ${entity}.`,
        );
      case '23503':
        throw new DatabaseOperationError(`Foreign key violation in ${entity}.`);
      case '23514':
        throw new DatabaseOperationError(`Check violation in ${entity}.`);
      case '22001':
        throw new DatabaseOperationError(
          `String data right truncation in ${entity}.`,
        );
      case '22003':
        throw new DatabaseOperationError(
          `Numeric value out of range in ${entity}.`,
        );
      default:
        this.logger.error(`Error creating ${entity}:`, error);
        throw new DatabaseOperationError(`Cannot create ${entity}.`);
    }
  }

  async migrate() {
    const client = postgres(this._NestDrizzleOptions.url, { max: 1 });
    if (this._NestDrizzleOptions.migrationOptions) {
      await migratePgJs(
        drizzlePgJs(client),
        this._NestDrizzleOptions.migrationOptions,
      );
    } else {
      throw new Error('Migration options are not defined');
    }
  }

  async getDrizzle() {
    let client: postgres.Sql<Record<string, never>>;

    if (!this._drizzle) {
      client = postgres(this._NestDrizzleOptions.url);
      try {
        await client`SELECT 1`; // Sending a test query to check connection
        this.logger.log('Database connected successfully');
      } catch (error) {
        this.logger.error('Database connection error', error);
        throw error; // Propagate the error
      }
      this._drizzle = drizzlePgJs(client, this._NestDrizzleOptions.options);
    }
    return this._drizzle;
  }
}
