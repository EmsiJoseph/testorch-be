import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Buffer } from 'buffer';
import { GatewayService } from '../gateway/gateway.service'; // Import GatewayService
import { KubernetesV2Service } from '../kubernetes/kubernetes-v2.service'; // Import KubernetesV2Service

@Injectable()
export class JenkinsService {
  private readonly logger = new Logger(JenkinsService.name);
  private readonly jenkinsMasterUrl: string | undefined;
  private readonly jenkinsJobName: string | undefined;
  private readonly jenkinsApiToken: string | undefined;
  private readonly jenkinsUsername: string | undefined;
  private stopMonitoring = false; // Add a flag to stop monitoring

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService, // Inject HttpService
    private readonly gatewayService: GatewayService, // Inject GatewayService
    private readonly kubernetesV2Service: KubernetesV2Service, // Inject KubernetesV2Service
  ) {
    this.jenkinsMasterUrl = this.configService.get<string>('JENKINS_MASTER_URL');
    this.jenkinsJobName = this.configService.get<string>('JENKINS_JOB_NAME');
    this.jenkinsApiToken = this.configService.get<string>('JENKINS_API_TOKEN');
    this.jenkinsUsername = this.configService.get<string>('JENKINS_USERNAME');
  }

  async triggerJenkinsJob(params: {
    slaveCount: number;
    scriptName: string;
    protocol: string;
    host: string;
    basePath: string;
    threadCount: number;
    startUpTime: number;
    holdLoadTime: number;
    shutdownTime: number;
    targetThroughputPerMin: number;
  }): Promise<any> {
    const {
      slaveCount,
      scriptName,
      protocol,
      host,
      basePath,
      threadCount,
      startUpTime,
      holdLoadTime,
      shutdownTime,
      targetThroughputPerMin,
    } = params;

    const jenkinsUrl = this.jenkinsMasterUrl;
    const jenkinsJobName = this.jenkinsJobName;
    const jenkinsApiToken = this.jenkinsApiToken;
    const jenkinsUsername = this.jenkinsUsername;
    // Construct the Jenkins job URL and parameters
    const jenkinsJobUrl = `${jenkinsUrl}/job/${jenkinsJobName}/buildWithParameters`;
    const jobParams = new URLSearchParams({
      slaveCount: slaveCount.toString(),
      scriptName,
      protocol,
      host,
      basePath,
      threadCount: threadCount.toString(),
      startUpTime: startUpTime.toString(),
      holdLoadTime: holdLoadTime.toString(),
      shutdownTime: shutdownTime.toString(),
      targetThroughputPerMin: targetThroughputPerMin.toString(),
    });

    const auth = Buffer.from(`${jenkinsUsername}:${jenkinsApiToken}`).toString('base64');

    try {
      this.logger.log(`Triggering Jenkins job at ${jenkinsJobUrl} with params: ${jobParams.toString()}`);

      // Trigger the Jenkins job
      const response = await firstValueFrom(
        this.httpService.post(
          `${jenkinsJobUrl}?${jobParams.toString()}`,
          {},
          {
            headers: {
              Authorization: `Basic ${auth}`,
            },
          },
        ),
      );

      if (response.status !== 201) {
        this.logger.error(`Failed to trigger Jenkins job: ${response.statusText}`);
        throw new Error(`Failed to trigger Jenkins job: ${response.statusText}`);
      }

      const queueUrl = response.headers['location'];
      this.logger.log(`Jenkins job triggered successfully. Queue URL: ${queueUrl}`);
      return { queueUrl };
    } catch (error) {
      this.logger.error(`Error triggering Jenkins job: ${error.message}`, error.stack);
      throw new Error(`Error triggering Jenkins job: ${error.message}`);
    }
  }

  async getBuildStatus(queueUrl: string): Promise<any> {
    const auth = Buffer.from(`${this.jenkinsUsername}:${this.jenkinsApiToken}`).toString('base64');
    try {
      const response = await firstValueFrom(
        this.httpService.get(queueUrl, {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Error fetching Jenkins build status: ${error.message}`, error.stack);
      throw new Error(`Error fetching Jenkins build status: ${error.message}`);
    }
  }

  async getQueueItemStatus(queueUrl: string): Promise<any> {
    const auth = Buffer.from(`${this.jenkinsUsername}:${this.jenkinsApiToken}`).toString('base64');
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${queueUrl}api/json?tree=cancelled,executable[url]`, {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        }),
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        this.logger.warn(`Queue item not found: ${queueUrl}`);
        return null;
      }
      this.logger.error(`Error fetching Jenkins queue item status: ${error.message}`, error.stack);
      throw new Error(`Error fetching Jenkins queue item status: ${error.message}`);
    }
  }

  async monitorBuild(slaveCount: number, queueUrl: string, callback: (data: any) => void): Promise<void> {
    this.stopMonitoring = false; // Reset the flag when starting monitoring
    const auth = Buffer.from(`${this.jenkinsUsername}:${this.jenkinsApiToken}`).toString('base64');

    const poll = async () => {
      if (this.stopMonitoring) {
        this.logger.log('Monitoring stopped.');
        return;
      }

      try {
        const queueItemStatus = await this.getQueueItemStatus(queueUrl);
        if (queueItemStatus === null) {
          this.logger.warn('Queue item not found, returning build data.');
          callback({ result: 'NOT_FOUND' });
          this.sendMessage('testDone', true);
          return;
        }

        if (queueItemStatus.cancelled) {
          this.logger.error('Jenkins job was cancelled.');
          this.sendMessage('buildStatus', { message: 'Jenkins job was cancelled.' });
          callback({ result: 'CANCELLED' });
          return;
        }

        if (queueItemStatus.executable) {
          const buildUrl = queueItemStatus.executable.url + 'api/json';
          const response = await firstValueFrom(
            this.httpService.get(buildUrl, {
              headers: {
                Authorization: `Basic ${auth}`,
              },
            }),
          );
          const buildData = response.data;
          const buildName = `testorch-job-${buildData.number}`;

          this.logger.log('Build in progress');
          this.sendMessage('buildStatus', { message: 'Build in progress' });

          let workerCount = 0; // Declare workerCount here

          // Continuously fetch pod statuses
          const fetchPodStatuses = async () => {
            const pods = await this.kubernetesV2Service.getPodsByBuildName(buildName);
            workerCount = 0; // Reset workerCount for each fetch
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
            this.sendMessage('podsStatus', podStatuses);

            if (workerCount >= slaveCount) {
              this.sendMessage('testRunning', true);
              // Calculate progress only if all worker nodes are running
              const elapsedTime = Date.now() - buildData.timestamp;
              const estimatedDuration = buildData.estimatedDuration;
              const progress = Math.min((elapsedTime / estimatedDuration) * 100, 100).toFixed(2);
              const remainingTime = Math.max((estimatedDuration - elapsedTime) / 60000, 0).toFixed(2); // in minutes
              this.sendMessage('buildProgress', { progress, remainingTime });

              if (progress === '100.00') {
                this.sendMessage('testDone', true);
                this.stopMonitoring = true; // Stop monitoring when the test is done
              }
            }
          };

          await fetchPodStatuses(); // Call fetchPodStatuses initially

          if (!buildData.result) {
            if (workerCount < slaveCount) {
              setImmediate(poll); // No delay, use setImmediate to continue polling
            } else {
              this.logger.log('All worker nodes are running.');
              this.sendMessage('buildStatus', { message: 'All worker nodes are running.' });
            }
          } else {
            this.logger.log('Build completed successfully');
            this.sendMessage('buildStatus', { message: 'Build completed successfully' });
            callback(buildData);
            this.stopMonitoring = true; // Stop monitoring when the build is completed
          }
        } else {
          this.logger.log('Job is still in the queue.');
          this.sendMessage('buildStatus', { message: 'Job is still in the queue.' });
          setImmediate(poll); // No delay, use setImmediate to continue polling
        }
      } catch (error) {
        this.logger.error(`Error fetching Jenkins build status: ${error.message}`, error.stack);
        this.sendMessage('buildStatus', { message: `Error fetching Jenkins build status: ${error.message}` });
        setImmediate(poll); // No delay, use setImmediate to continue polling
      }
    };

    poll();
  }

  private sendMessage(event: string, message: any) {
    this.logger.log(`Sending message: ${event} - ${JSON.stringify(message)}`);
    this.gatewayService.sendMessage(event, message);
  }
}
