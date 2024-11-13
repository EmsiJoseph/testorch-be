import { HttpModule } from '@nestjs/axios'; // Import HttpModule
import { forwardRef, Module } from '@nestjs/common';
import { KubernetesClient } from './client/kubernetes-client';
import { JenkinsService } from './services/jenkins/jenkins.service'; // Import JenkinsService

import { USERS_REPOSITORY_TOKEN } from '../application/interfaces/repositories/users.repository.interface';
import { InfluxdbClient } from './client/influxdb-client';
import { NestDrizzleModule } from './database/drizzle.module'; // Import GitHubService
import * as schema from './database/schema';
import { ProjectRepository } from './repositories/project/project.repository';
import { TeamRepository } from './repositories/team/team.repository';
import { TestPlanRepositoryV2 } from './repositories/test-plan/test-plan.repository-v2'; // Import TestPlanRepositoryV2
import { UsersRepository } from './repositories/users/users.repository';
import { Auth0Service } from './services/auth0/auth0.service';
import { GatewayService } from './services/gateway/gateway.service';
import { GitHubService } from './services/github/github.service';
import { JenkinsGateway } from './services/jenkins/jenkins.gateway';
import { KubernetesV2Service } from './services/kubernetes/kubernetes-v2.service';
import { SetupService } from './services/setup.service';

@Module({
  imports: [
    forwardRef(() => InfrastructureModule), // Use forwardRef to resolve circular dependencies
    HttpModule, // Ensure HttpModule is imported
    NestDrizzleModule.forRootAsync({
      useFactory: () => {
        return {
          driver: 'postgres-js',
          url: process.env.DATABASE_URL || 'default_database_url',
          options: { schema },
          migrationOptions: { migrationsFolder: './migration' },
        };
      },
    }),
  ],
  providers: [
    InfluxdbClient, // Register InfluxdbClient as a provider
    KubernetesV2Service,
    JenkinsService, // Register JenkinsService as a provider
    KubernetesClient,
    TeamRepository,
    ProjectRepository,
    TestPlanRepositoryV2, // Register TestPlanRepositoryV2 as a provider
    GitHubService,
    {
      provide: USERS_REPOSITORY_TOKEN,
      useClass: UsersRepository,
    },
    UsersRepository,
    Auth0Service,
    TestPlanRepositoryV2, // Register TestPlanService as a provider
    SetupService,
    GatewayService,
    JenkinsGateway,
  ],
  exports: [
    TeamRepository,
    UsersRepository,
    ProjectRepository,
    KubernetesV2Service,
    JenkinsService, // Export JenkinsService
    InfluxdbClient,
    TestPlanRepositoryV2, // Export TestPlanRepositoryV2
    GitHubService,
    USERS_REPOSITORY_TOKEN,
    Auth0Service,
    TestPlanRepositoryV2,
    SetupService,
    GatewayService,
    JenkinsGateway,
  ],
})
export class InfrastructureModule {}
