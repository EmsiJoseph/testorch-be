import { GitHubService } from 'src/core/infrastructure/services/github/github.service';
import { AddTestPlanV2Dto } from 'src/core/presentation/dto/test-plan.dto';
import { ITeamRepository } from '../interfaces/repositories/team.repository.interface.js';
import { ITestPlanRepository } from '../interfaces/repositories/test-plan.repository.interface.ts';
import { IUsersRepository } from '../interfaces/repositories/users.repository.interface.js';

export async function addTestPlanV2UseCase(
  addTestPlanV2Dto: AddTestPlanV2Dto,
  testPlanRepo: ITestPlanRepository,
  userRepo: IUsersRepository,
  githubService: GitHubService,
  teamRepo: ITeamRepository,
): Promise<any> {
  const testPlanExists = await testPlanRepo.getTestPlanByName(
    addTestPlanV2Dto.name,
    addTestPlanV2Dto.projectName,
  );

  if (testPlanExists) {
    throw new Error('Test plan already exists');
  }

  const user = await userRepo.getUserByEmail(addTestPlanV2Dto.email);

  if (!user) {
    throw new Error('User not found');
  }

  const team = await teamRepo.getTeamByAuth0OrgId(
    addTestPlanV2Dto.auth0_org_id,
  );
  if (!team) {
    throw new Error('Team not found');
  }

  // Add InfluxDB backend listener
  const base64Content = addTestPlanV2Dto.file.replace(
    /^data:application\/octet-stream;base64,/,
    '',
  );
  // const modifiedFileBase64 = await jmeterService.addInfluxDBListener(
  //   base64Content,
  //   influxDbCredentials.token,
  //   influxDbUrl,
  //   team.name,
  //   projectName,
  // );

  let location;
  try {
    const res = await githubService.uploadTestPlan(
      team.name,
      user.id,
      addTestPlanV2Dto.projectName,
      addTestPlanV2Dto.name,
      addTestPlanV2Dto.fileName,
      base64Content,
      `Add test plan: ${addTestPlanV2Dto.name}`,
    );
    location = res.content.path;
  } catch (error) {
    throw new Error(`${error.message}`);
  }

  console.log("Path", location)

  
  await testPlanRepo.addTestPlan(
    addTestPlanV2Dto.name,
    addTestPlanV2Dto.description || null,
    location,
    user.id,
    addTestPlanV2Dto.projectName,
    addTestPlanV2Dto.type,
  );

  return { success: true };
}
