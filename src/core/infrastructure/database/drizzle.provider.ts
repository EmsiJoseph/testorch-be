import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE_ORM, NEST_DRIZZLE_OPTIONS } from '../../../constants/db.constant';
import { DrizzleService } from './drizzle.service';
import { NestDrizzleOptions } from '../../application/interfaces/services/drizzle.interfaces';

export const connectionFactory = {
  provide: DRIZZLE_ORM,
  useFactory: async (nestDrizzleService: {
    getDrizzle: () => Promise<PostgresJsDatabase>;
  }) => {
    return nestDrizzleService.getDrizzle();
  },
  inject: [DrizzleService],
};

export function createNestDrizzleProviders(options: NestDrizzleOptions) {
  return [
    {
      provide: NEST_DRIZZLE_OPTIONS,
      useValue: options,
    },
  ];
}