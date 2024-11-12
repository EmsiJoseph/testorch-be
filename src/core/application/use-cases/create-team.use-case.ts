import { TeamSelectType } from 'src/core/domain/models/team';
import { CreateTeamDto } from '../../presentation/dto/team.dto';
import { ITeamRepository } from '../interfaces/repositories/team.repository.interface';
import { IUsersRepository } from '../interfaces/repositories/users.repository.interface';

/**
 * Function to create a team.
 * @param createTeamDto - The name of the team to be created.
 * @param teamRepo - The repository to handle team data.
 * @param influxdbService - The service to handle InfluxDB operations.
 * @param userId
 * @returns The result of the team creation process.
 */
export async function createTeamUseCase(
  createTeamDto: CreateTeamDto,
  teamRepo: ITeamRepository,
  userRepo: IUsersRepository,
): Promise<TeamSelectType> {
  const user = await userRepo.getUserByEmail(createTeamDto.email);
  if (!user) {
    throw new Error('User not found');
  }

  // Create the team in the team repository
  return await teamRepo.createTeam(createTeamDto, user.id);
}
