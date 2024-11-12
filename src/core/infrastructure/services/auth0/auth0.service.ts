import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ManagementClient } from 'auth0';
import { SignUpDto } from 'src/core/presentation/dto/user.dto';

@Injectable()
export class Auth0Service {
  private managementClient: ManagementClient;
  private logger = new Logger(Auth0Service.name);

  constructor(private configService: ConfigService) {
    this.managementClient = new ManagementClient({
      domain: this.configService.get<string>('AUTH0_DOMAIN_FOR_MANAGEMENT') || '',
      clientId: this.configService.get<string>('AUTH0_MANAGEMENT_CLIENT_ID') || '',
      clientSecret: this.configService.get<string>('AUTH0_MANAGEMENT_CLIENT_SECRET') || '',
    });
  }

  // Get user by Auth0 ID
  async getUser(auth0Id: string) {
    try {
      return await this.managementClient.users.get({ id: auth0Id });
    } catch (error) {
      this.logger.error(`Error fetching user: ${error.message}`);
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
  }

  // Get user by email
  async getUserByEmail(signUpDto: SignUpDto) {
    try {
      const { email } = signUpDto;
      // Fetch users with the specified email
      const usersResponse = await this.managementClient.users.getAll({
        q: `email:"${email}"`,
        search_engine: 'v3',
      });

      // Access the data array from the ApiResponse
      const users = usersResponse.data;

      // Check if users array has at least one user
      if (users && users.length > 0) {
        return users[0]; // Return the first matched user
      } else {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
    } catch (error) {
      this.logger.error(`Error fetching user by email: ${error.message}`);
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
  }

  // Create a new user
  async createUser(email: string, password: string) {
    try {
      return await this.managementClient.users.create({
        connection: 'Username-Password-Authentication',
        email,
        password,
      });
    } catch (error) {
      this.logger.error(`Error creating user: ${error.message}`);
      throw new HttpException('User creation failed', HttpStatus.BAD_REQUEST);
    }
  }

  // Update user
  async updateUser(auth0Id: string, updates: Partial<any>) {
    try {
      return await this.managementClient.users.update({ id: auth0Id }, updates);
    } catch (error) {
      this.logger.error(`Error updating user: ${error.message}`);
      throw new HttpException('User update failed', HttpStatus.BAD_REQUEST);
    }
  }

  // Delete user
  async deleteUser(auth0Id: string) {
    try {
      await this.managementClient.users.delete({ id: auth0Id });
      this.logger.log(`User ${auth0Id} deleted successfully`);
    } catch (error) {
      this.logger.error(`Error deleting user: ${error.message}`);
      throw new HttpException('User deletion failed', HttpStatus.BAD_REQUEST);
    }
  }

  // Get a list of users
  async listUsers() {
    try {
      return await this.managementClient.users.getAll();
    } catch (error) {
      this.logger.error(`Error listing users: ${error.message}`);
      throw new HttpException('User listing failed', HttpStatus.BAD_REQUEST);
    }
  }
}
