import { ITestPlanRepository } from '../interfaces/repositories/test-plan.repository.interface.ts';
import { IUsersRepository } from '../interfaces/repositories/users.repository.interface';

export async function getTestPlanssUseCase(
  projectName: string,
  createdBy: string,
  testPlanRepo: ITestPlanRepository,
  userRepo: IUsersRepository,
): Promise<any> {
  const testPlans = await testPlanRepo.getTestPlans(projectName, createdBy);

  if (!testPlans) {
    return [];
  }

  const result = await Promise.all(
    testPlans.map(async (testPlan) => {
      const user = await userRepo.getUser(testPlan.created_by);
      return {
        ...testPlan,
        createdByName:
          user && user.first_name
            ? `${user.first_name} ${user.last_name}`
            : user
              ? user.email
              : 'Unknown',
        //   TODO: Implement getRecentTestPlans
        recentExecution: [],
      };
    }),
  );

  return result;
}
