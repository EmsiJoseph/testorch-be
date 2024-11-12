import { TestPlanSelectType } from 'src/core/domain/models/test-plan';
import { AddTestPlanDto } from 'src/core/presentation/dto/test-plan.dto';

export interface ITestPlanRepository {
  processFile(file: Express.Multer.File): Promise<any>;
  getRecentTestPlans(
    projectId: string,
    limit: number,
  ): Promise<TestPlanSelectType[]>;
  getFilePath(fileName: string): string;
  addTestPlan(
    testPlanName: string,
    description: string | null,
    location: string,
    createdBy: string,
    projectName: string,
    type: string,
  ): Promise<TestPlanSelectType>;

  getTestPlanByName(name: string, projectName: string): Promise<TestPlanSelectType | undefined>;

  getTestPlans(
    projectName: string,
    createdBy: string,
  ): Promise<TestPlanSelectType[] | undefined>;

  processBase64File(uploadFileDto: AddTestPlanDto): string;

  getTestPlanByNameAndProjectName(testPlanName: string, projectName: string): Promise<TestPlanSelectType>;
}
