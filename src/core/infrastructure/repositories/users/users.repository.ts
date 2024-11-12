import { Inject, Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { v4 as uuidv4 } from 'uuid';
import { DRIZZLE_ORM } from '../../../../constants/db.constant';
import { IUsersRepository } from '../../../application/interfaces/repositories/users.repository.interface';
import { DatabaseOperationError } from '../../../domain/errors/common';
import { UserInsertType, UserSelectType } from '../../../domain/models/user';
import { DrizzleService } from '../../database/drizzle.service';
import * as schema from '../../database/schema';
import { users } from '../../database/schema';

@Injectable()
export class UsersRepository implements IUsersRepository {
  private readonly logger = new Logger(UsersRepository.name);
  constructor(
    @Inject(DRIZZLE_ORM) private conn: PostgresJsDatabase<typeof schema>,
    private readonly drizzleService: DrizzleService,
  ) {}

  async getUser(id: string): Promise<UserSelectType | undefined> {
    const query = this.conn.query.users.findFirst({
      where: eq(users.id, id),
    });
    return await query.execute();
  }

  async getUserByEmail(email: string): Promise<UserSelectType | undefined> {
    const query = this.conn.query.users.findFirst({
      where: eq(users.email, email),
    });

    return await query.execute();
  }

  async createUser(input: UserInsertType): Promise<UserSelectType> {
    try {
      input.id = input.id ?? uuidv4();

      const query = this.conn
        .insert(users)
        .values({
          id: input.id ?? '', // Provide default values if necessary
          auth0_id: input.auth0_id ?? '',
          first_name: input.first_name ?? '',
          last_name: input.last_name ?? '',
          email: input.email ?? '',
        })
        .returning();

      const [created] = await query.execute();

      if (created) {
        this.logger.log(`User created: ${created.id}`);
        return created;
      } else {
        throw new DatabaseOperationError('Cannot create user.');
      }
    } catch (error) {
      this.drizzleService.handlePostgresError(error, 'User');
    }
  }
}
