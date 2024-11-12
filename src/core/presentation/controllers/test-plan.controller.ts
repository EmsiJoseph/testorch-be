import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { addTestPlanV2UseCase } from 'src/core/application/use-cases/add-test-plan-v2.use-case';
import { addTestPlanUseCase } from 'src/core/application/use-cases/add-test-plan.use-case';
import { getTestPlanssUseCase } from 'src/core/application/use-cases/get-test-plans.use-case';
import { startTestPlanV3UseCase } from 'src/core/application/use-cases/start-test-plan-v3.use-case';
import { TeamRepository } from 'src/core/infrastructure/repositories/team/team.repository';
import { TestPlanRepositoryV2 } from 'src/core/infrastructure/repositories/test-plan/test-plan.repository-v2';
import { UsersRepository } from 'src/core/infrastructure/repositories/users/users.repository';
import { GitHubService } from 'src/core/infrastructure/services/github/github.service';
import { JenkinsService } from 'src/core/infrastructure/services/jenkins/jenkins.service'; // Import JenkinsService
import { AuthorizationGuard } from 'src/foundation/guards/authorization.guard';
import {
  AddTestPlanDto,
  AddTestPlanV2Dto,
  StartTestV2Dto,
} from '../dto/test-plan.dto';
import { GatewayService } from 'src/core/infrastructure/services/gateway/gateway.service';
import { KubernetesV2Service } from 'src/core/infrastructure/services/kubernetes/kubernetes-v2.service';

@Controller('test-plan-management')
export class TestPlanController {
  constructor(
    private readonly testPlanRepo: TestPlanRepositoryV2,
    private readonly userRepo: UsersRepository,
    private readonly githubService: GitHubService, // Inject GitHubService
    private readonly teamRepo: TeamRepository,
    private readonly jenkinsService: JenkinsService, // Inject JenkinsService
    private readonly kubernetesv2Service: KubernetesV2Service,
    private readonly gatewayService: GatewayService
  ) {}

  @UseGuards(AuthorizationGuard)
  @Post('add-test-plan')
  async addTestPlan(@Body() addTestPlanDto: AddTestPlanDto) {
    const testData = await addTestPlanUseCase(
      addTestPlanDto,
      this.testPlanRepo,
      this.userRepo,
    );
    return {
      message: 'Test plan added successfully',
      ...testData,
    };
  }

  @UseGuards(AuthorizationGuard)
  @Post('add-test-plan-v2')
  async addTestPlanV2(@Body() addTestPlanV2Dto: AddTestPlanV2Dto) {
    const testData = await addTestPlanV2UseCase(
      addTestPlanV2Dto,
      this.testPlanRepo,
      this.userRepo,
      this.githubService,
      this.teamRepo,
    );
    return {
      message: 'Test plan added successfully',
      ...testData,
    };
  }

  @UseGuards(AuthorizationGuard)
  @Get('get-test-plans/:projectName')
  async getTestPlans(
    @Param('projectName') projectName: string,
    @Request() req,
  ) {
    const userId = req.auth.sub; // Assuming the user ID is in the 'sub' field
    const testPlans = await getTestPlanssUseCase(
      projectName,
      userId,
      this.testPlanRepo,
      this.userRepo,
    );
    return {
      message: 'Test plans fetched successfully',
      data: testPlans,
    };
  }

  @UseGuards(AuthorizationGuard)
  @Post('start-test-v3')
  async startTestV2(
    @Body() startTestDto: StartTestV2Dto, // Use the new DTO
  ) {
    const result = await startTestPlanV3UseCase(
      startTestDto,
      this.testPlanRepo,
      this.githubService,
      this.jenkinsService, // Pass JenkinsService to the use case
      this.userRepo,
      this.teamRepo,
      this.gatewayService,
      this.kubernetesv2Service
    );
    return result;
  }
}
