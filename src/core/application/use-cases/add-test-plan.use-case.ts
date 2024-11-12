import {
  AddTestPlanDto,
  AddTestPlanV2Dto,
} from 'src/core/presentation/dto/test-plan.dto';
import { ITestPlanRepository } from '../interfaces/repositories/test-plan.repository.interface.ts';
import { IUsersRepository } from '../interfaces/repositories/users.repository.interface.js';

export async function addTestPlanUseCase(
  addTestPlanDto: AddTestPlanDto | AddTestPlanV2Dto,
  testPlanRepo: ITestPlanRepository,
  userRepo: IUsersRepository,
): Promise<any> {
  const testPlanExists = await testPlanRepo.getTestPlanByName(
    addTestPlanDto.name,
    addTestPlanDto.projectName,
  );

  if (testPlanExists) {
    throw new Error('Test plan already exists');
  }

  const user = await userRepo.getUserByEmail(addTestPlanDto.email);

  if (!user) {
    throw new Error('User not found');
  }

  const location = testPlanRepo.getFilePath(addTestPlanDto.fileName);

  await testPlanRepo.addTestPlan(
    addTestPlanDto.name,
    addTestPlanDto.description || '',
    location,
    user.id,
    addTestPlanDto.projectName,
    addTestPlanDto.type,
  );

  return await testPlanRepo.processBase64File(addTestPlanDto);
}
