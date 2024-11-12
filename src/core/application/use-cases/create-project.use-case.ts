import { ProjectSelectType } from 'src/core/domain/models/project';
import { CreateProjectDto } from 'src/core/presentation/dto/project.dto';
import { IProjectRepository } from '../interfaces/repositories/project.repository.interface';
import { ITeamRepository } from '../interfaces/repositories/team.repository.interface';
import { IUsersRepository } from '../interfaces/repositories/users.repository.interface';

/**
 * Function to create a project.
 * @param createProjectDto - The details of the project to be created.
 * @param projectRepo - The repository to handle project data.
 * @param influxdbService - The service to handle InfluxDB operations.
 * @param teamRepo - The repository to handle team data.
 * @returns The result of the project creation process.
 */
export async function createProjectUseCase(
  createProjectDto: CreateProjectDto,
  projectRepo: IProjectRepository,
  teamRepo: ITeamRepository,
  userRepo: IUsersRepository,
): Promise<ProjectSelectType> {
  // Get the team ID from the auth0_org_id

  const team = await teamRepo.getTeamByAuth0OrgId(
    createProjectDto.auth0_org_id,
  );

  if (!team) {
    throw new Error('Team not found');
  }

  const project = await projectRepo.getProject(createProjectDto.name, team.id);

  if (project) {
    throw new Error('Project already exists');
  }

  const user = await userRepo.getUserByEmail(createProjectDto.email);

  if (!user) {
    throw new Error('User not found');
  }

  // Create the project in the project repository
  return await projectRepo.createProject(createProjectDto, team.id, user.id);
}
