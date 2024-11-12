import { Body, Controller, Inject, Post } from '@nestjs/common';
import { USERS_REPOSITORY_TOKEN } from '../../application/interfaces/repositories/users.repository.interface';
import { UsersRepository } from '../../infrastructure/repositories/users/users.repository';
import { Auth0Service } from '../../infrastructure/services/auth0/auth0.service';
import { SignUpDto } from '../dto/user.dto';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(USERS_REPOSITORY_TOKEN) private readonly userRepo: UsersRepository,
    private readonly auth0Service: Auth0Service, // Inject Auth0Service
  ) {}

  @Post('add-user-from-auth0')
  async addUserFromAuth0(@Body() signUpDto: SignUpDto) {
    const auth0User = await this.auth0Service.getUserByEmail(signUpDto);
    const user = {
      id: auth0User.user_id,
      auth0_id: auth0User.user_id,
      first_name: auth0User.given_name,
      last_name: auth0User.family_name,
      email: auth0User.email,
    };
    await this.userRepo.createUser(user);
    return { message: 'User added successfully' };
  }
}
