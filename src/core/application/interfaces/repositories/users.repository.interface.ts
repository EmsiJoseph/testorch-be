import { UserInsertType, UserSelectType } from 'src/core/domain/models/user';

export const USERS_REPOSITORY_TOKEN = Symbol('IUsersRepository');

export interface IUsersRepository {
  createUser(input: UserInsertType): Promise<UserSelectType>;
  getUserByEmail(email: string): Promise<UserSelectType | undefined>;
  getUser(id: string): Promise<UserSelectType | undefined>;
}
