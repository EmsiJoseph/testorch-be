import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { AuthController } from './controllers/auth.controller';
import { ProjectController } from './controllers/project.controller';
import { TeamController } from './controllers/team.controller';
import { TestPlanController } from './controllers/test-plan.controller';
import { JmxController } from './controllers/jmx.controller';

@Module({
  imports: [InfrastructureModule],
  controllers: [
    TeamController,
    AuthController,
    TestPlanController,
    ProjectController,
    JmxController,
  ],
})
export class PresentationModule {}
