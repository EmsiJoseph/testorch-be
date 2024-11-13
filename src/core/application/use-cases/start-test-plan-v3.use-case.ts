import { GitHubService } from 'src/core/infrastructure/services/github/github.service.js';
import { JenkinsService } from 'src/core/infrastructure/services/jenkins/jenkins.service'; // Import JenkinsService
import { StartTestV2Dto } from 'src/core/presentation/dto/test-plan.dto.js';
import { ITeamRepository } from '../interfaces/repositories/team.repository.interface.js';
import { ITestPlanRepository } from '../interfaces/repositories/test-plan.repository.interface.ts';
import { IUsersRepository } from '../interfaces/repositories/users.repository.interface.js';
import { GatewayService } from 'src/core/infrastructure/services/gateway/gateway.service'; // Import GatewayService
import { KubernetesV2Service } from 'src/core/infrastructure/services/kubernetes/kubernetes-v2.service'; // Import KubernetesV2Service

export async function startTestPlanV3UseCase(
  startTestDto: StartTestV2Dto,
  testPlanRepo: ITestPlanRepository,
  githubService: GitHubService,
  jenkinsService: JenkinsService, // Add JenkinsService as a parameter
  userRepo: IUsersRepository,
  teamRepo: ITeamRepository,
  gatewayService: GatewayService, // Add GatewayService as a parameter
  kubernetesV2Service: KubernetesV2Service, // Add KubernetesV2Service as a parameter
): Promise<any> {
  const {
    testPlanName,
    projectName,
    email,
    auth0_org_id,
    workerNodes,
    protocol,
    host,
    basePath,
    threadCount,
    startUpTime,
    holdLoadTime,
    shutdownTime,
    targetThroughputPerMin,
  } = startTestDto;

  const user = await userRepo.getUserByEmail(email);
  if (!user) {
    throw new Error('User not found');
  }
  const userId = user.id;

  const team = await teamRepo.getTeamByAuth0OrgId(auth0_org_id);
  if (!team) {
    throw new Error('Team not found');
  }

  const teamName = team.name;

  // Get the JMX URL from the test plan repository
  const { location } = await testPlanRepo.getTestPlanByNameAndProjectName(
    testPlanName,
    projectName,
  );

  if (!location) {
    throw new Error('Test plan not found');
  }

  const { content, name } = await githubService.getUploadedTestPlan(location);

  if (!content) {
    throw new Error('Test plan not found');
  }

  const res = await githubService.uploadTestPlanToTestorchJob(
    content,
    name,
    userId,
    teamName,
    projectName,
  );

  const fileName = res.content.name;
  const filePath = res.content.path;
  console.log("File path: ", filePath);
  const fileSha = res.content.sha;

  // Trigger Jenkins job through Jenkins service
  const { queueUrl } = await jenkinsService.triggerJenkinsJob({
    slaveCount: workerNodes,
    scriptName: fileName,
    protocol,
    host,
    basePath,
    threadCount,
    startUpTime,
    holdLoadTime,
    shutdownTime,
    targetThroughputPerMin,
  });

  // Monitor Jenkins build through polling
  return new Promise((resolve) => {
    jenkinsService.monitorBuild(queueUrl, async (buildData) => {
      if (buildData.result) {
        // Log build completion
        gatewayService.sendMessage('buildStatus', { message: 'Build completed' });
        gatewayService.sendMessage('buildProgress', { progress: "100", remainingTime: "0" });

        // Delete the test plan after the build is completed
        try {
          await githubService.deleteTestPlanFromTestorchJob(filePath, fileSha);
          console.log('Test plan deleted successfully');
        } catch (error) {
          console.error(`Failed to delete test plan: ${error.message}`);
        }

        // Get the pods related to the build
        const buildName = `testorch-job-${buildData.number}`;
        const pods = await kubernetesV2Service.getPodsByBuildName(buildName);
        let workerCount = 0;
        const podStatuses = pods.map(pod => {
          let type = 'agent';
          if (pod.metadata?.name?.includes('master')) {
            type = 'controller';
          } else if (pod.metadata?.name?.includes('slave')) {
            workerCount += 1;
            type = `worker ${workerCount}`;
          }
          return {
            id: pod.metadata?.name || 'unknown',
            type,
            status: pod.status.phase,
          };
        });
        gatewayService.sendMessage('podsStatus', podStatuses );

        // Resolve the promise with the build status
        resolve({ message: 'Test completed successfully', buildData });
      } else {
        // Log build progress
        gatewayService.sendMessage('buildStatus', { message: 'Build in progress' });
      }
    });
  });
}
