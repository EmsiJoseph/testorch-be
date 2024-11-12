import { ProjectSelectType } from 'src/core/domain/models/project';
import { CreateProjectDto } from 'src/core/presentation/dto/project.dto';

export interface IProjectRepository {
  createProject(
    createProjectDto: CreateProjectDto,
    teamId: string,
    createdBy: string,
  ): Promise<ProjectSelectType>;

  getProject(
    projectName: string,
    teamId: string,
  ): Promise<ProjectSelectType | undefined>;

  deleteProject(projectName: string): Promise<void>;

  getProjects(teamId: string): Promise<ProjectSelectType[]>;
}
