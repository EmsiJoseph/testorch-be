import { IProjectRepository } from '../interfaces/repositories/project.repository.interface';
import { ITeamRepository } from '../interfaces/repositories/team.repository.interface';
import { ITestPlanRepository } from '../interfaces/repositories/test-plan.repository.interface.ts';
import { IUsersRepository } from '../interfaces/repositories/users.repository.interface';

export async function getProjectsUseCase(
  auth0OrgId: string,
  teamRepo: ITeamRepository,
  projectRepo: IProjectRepository,
  userRepo: IUsersRepository,
  testPlanRepo: ITestPlanRepository,
): Promise<any> {
  const team = await teamRepo.getTeamByAuth0OrgId(auth0OrgId);
  if (!team) {
    throw new Error('Team not found');
  }
  const projects = await projectRepo.getProjects(team.id);

  const result = await Promise.all(
    projects.map(async (project) => {
      const user = await userRepo.getUser(project.created_by);
      const recentTestplan = await testPlanRepo.getRecentTestPlans(
        project.name as string,
        1,
      );

      return {
        ...project,
        createdByName: user && user.first_name
          ? `${user.first_name} ${user.last_name}`
          : user ? user.email : 'Unknown',
        recentTestPlan: recentTestplan || null,
      };
    }),
  );

  return result;
}
