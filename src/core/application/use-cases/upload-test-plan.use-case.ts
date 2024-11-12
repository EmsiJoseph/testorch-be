import { ITestPlanRepository } from '../interfaces/repositories/test-plan.repository.interface.ts';

/**
 * Function to upload a test plan.
 * @param file - The file to be processed.
 * @param testPlanRepository - The repository to handle test plan data.
 * @returns The result of the file processing.
 */
export async function uploadTestPlanUseCase(
  file: Express.Multer.File,
  testPlanRepository: ITestPlanRepository,
): Promise<any> {
  return testPlanRepository.processFile(file);
}
