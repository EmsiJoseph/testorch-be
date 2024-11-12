import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { IProjectRepository } from 'src/core/application/interfaces/repositories/project.repository.interface';
import { ProjectSelectType } from 'src/core/domain/models/project';
import { CreateProjectDto } from 'src/core/presentation/dto/project.dto';
import { DRIZZLE_ORM } from '../../../../constants/db.constant';
import { DatabaseOperationError } from '../../../domain/errors/common';
import * as schema from '../../database/schema';
import { projects } from '../../database/schema';
import { DrizzleService } from '../../database/drizzle.service';

@Injectable()
export class ProjectRepository implements IProjectRepository {
  private readonly logger = new Logger(ProjectRepository.name);

  constructor(
    @Inject(DRIZZLE_ORM) private conn: PostgresJsDatabase<typeof schema>,
    private readonly drizzleService: DrizzleService
  ) {}

  async createProject(
    createProjectDto: CreateProjectDto,
    teamId: string,
    createdBy: string, // Add createdBy parameter
  ): Promise<ProjectSelectType> {
    try {
      const query = this.conn
        .insert(projects)
        .values({
          name: createProjectDto.name,
          description: createProjectDto.description,
          team_id: teamId,
          created_by: createdBy, // Include created_by
        })
        .returning();

      const [createdProject] = await query.execute();

      if (!createdProject) {
        throw new Error('Failed to create project');
      }

      return createdProject;
    } catch (error) {
      this.logger.error('Error creating project:', error);
      throw new DatabaseOperationError('Failed to create project', error);
    }
  }

  // Placeholder methods for other CRUD operations
  async getProject(
    projectName: string,
    teamId: string,
  ): Promise<ProjectSelectType | undefined> {
    try {
      const query = this.conn.query.projects.findFirst({
        where: and(
          eq(projects.name, projectName),
          eq(projects.team_id, teamId),
        ),
      });
      return await query.execute();
    } catch (error) {
      this.drizzleService.handlePostgresError(error, 'Test');
    }
  }

  async deleteProject(projectName: string): Promise<void> {
    console.log(`Deleting project ${projectName}`);
  }

  async getProjects(teamId: string): Promise<ProjectSelectType[]> {
    try {
      const query = this.conn
        .select()
        .from(projects)
        .where(eq(projects.team_id, teamId));

      const projectList = await query.execute();

      return projectList;
    } catch (error) {
      this.logger.error('Error fetching projects:', error);
      throw new DatabaseOperationError('Failed to fetch projects', error);
    }
  }
}
