import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KubeConfig, CoreV1Api } from '@kubernetes/client-node';

@Injectable()
export class KubernetesV2Service {
  private readonly logger = new Logger(KubernetesV2Service.name);
  private readonly kubeConfig: KubeConfig;
  private readonly coreV1Api: CoreV1Api;

  constructor(private readonly configService: ConfigService) {
    this.kubeConfig = new KubeConfig();
    this.kubeConfig.loadFromDefault();
    this.coreV1Api = this.kubeConfig.makeApiClient(CoreV1Api);
  }

  async getPodsByBuildName(buildName: string): Promise<any> {
    try {
      const namespace = "perf-platform";
      const response = await this.coreV1Api.listNamespacedPod(namespace);
      return response.body.items.filter(pod => pod.metadata?.name?.includes(buildName));
    } catch (error) {
      this.logger.error(`Error fetching pods for build name ${buildName}: ${error.message}`, error.stack);
      throw new Error(`Error fetching pods for build name ${buildName}: ${error.message}`);
    }
  }
}