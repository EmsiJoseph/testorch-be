import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Buffer } from 'buffer';
import { GatewayService } from '../gateway/gateway.service'; // Import GatewayService

@Injectable()
export class JenkinsService {
  private readonly logger = new Logger(JenkinsService.name);
  private readonly jenkinsMasterUrl: string | undefined;
  private readonly jenkinsJobName: string | undefined;
  private readonly jenkinsApiToken: string | undefined;
  private readonly jenkinsUsername: string | undefined;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService, // Inject HttpService
    private readonly gatewayService: GatewayService, // Inject GatewayService
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
      this.logger.error(`Error fetching Jenkins queue item status: ${error.message}`, error.stack);
      throw new Error(`Error fetching Jenkins queue item status: ${error.message}`);
    }
  }

  async monitorBuild(queueUrl: string, callback: (data: any) => void): Promise<void> {
    const auth = Buffer.from(`${this.jenkinsUsername}:${this.jenkinsApiToken}`).toString('base64');
    let delay = 5000; // Initial delay of 5 seconds

    const poll = async () => {
      try {
        const queueItemStatus = await this.getQueueItemStatus(queueUrl);
        if (queueItemStatus.cancelled) {
          this.logger.error('Jenkins job was cancelled.');
          this.gatewayService.sendMessage('buildStatus', { message: 'Jenkins job was cancelled.' });
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
          this.logger.log(`Build status: ${JSON.stringify(buildData)}`);
          this.gatewayService.sendMessage('buildStatus', { message: 'Build in progress', buildData });
          callback(buildData);

          if (!buildData.result) {
            setTimeout(poll, delay);
            delay = Math.min(delay * 2, 60000); // Exponential backoff, max 1 minute
          }
        } else {
          this.logger.log('Job is still in the queue.');
          this.gatewayService.sendMessage('buildStatus', { message: 'Job is still in the queue.' });
          setTimeout(poll, delay);
          delay = Math.min(delay * 2, 60000); // Exponential backoff, max 1 minute
        }
      } catch (error) {
        this.logger.error(`Error fetching Jenkins build status: ${error.message}`, error.stack);
        this.gatewayService.sendMessage('buildStatus', { message: `Error fetching Jenkins build status: ${error.message}` });
        setTimeout(poll, delay);
        delay = Math.min(delay * 2, 60000); // Exponential backoff, max 1 minute
      }
    };

    poll();
  }
}
