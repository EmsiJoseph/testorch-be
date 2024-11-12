import * as k8s from '@kubernetes/client-node';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IncomingMessage } from 'http';
import { IKubernetesClient } from '../../application/interfaces/client/kubernetes-client.interface';
import { KubernetesHttpError } from '../../domain/errors/common'; // Corrected import statement

@Injectable()
export class KubernetesClient implements IKubernetesClient {
  private readonly logger = new Logger(KubernetesClient.name);

  private readonly jenkinsMasterUrl: string | undefined;
  private readonly jenkinsJobName: string | undefined;

  public k8sCoreApi: k8s.CoreV1Api;
  public k8sRbacApi: k8s.RbacAuthorizationV1Api;
  public k8sAppsApi: k8s.AppsV1Api;

  constructor(private readonly configService: ConfigService) {
    const kc = new k8s.KubeConfig();

    // Always load the configuration from the default kubeconfig
    this.logger.log(
      'Using local kubeconfig file for Kubernetes configuration.',
    );
    kc.loadFromDefault(); // This will use ~/.kube/config or KUBECONFIG environment variable

    // Initialize the Kubernetes API clients
    this.k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api);
    this.k8sRbacApi = kc.makeApiClient(k8s.RbacAuthorizationV1Api);
    this.k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api);

    this.jenkinsMasterUrl =
      this.configService.get<string>('JENKINS_MASTER_URL');
    this.jenkinsJobName = this.configService.get<string>('JENKINS_JOB_NAME');
  }

  async createNamespace(namespace: string): Promise<void> {
    try {
      const namespaceExists = await this.namespaceExists(namespace);
      if (namespaceExists) {
        this.logger.log(
          `Namespace ${namespace} already exists. Skipping creation.`,
        );
        return;
      }

      await this.k8sCoreApi.createNamespace({ metadata: { name: namespace } });
      this.logger.log(`Namespace ${namespace} created successfully.`);
    } catch (error) {
      this.handleKubernetesError(
        error,
        `Failed to create namespace '${namespace}'`,
      );
    }
  }

  async createSecret(
    namespace: string,
    secretManifest: k8s.V1Secret,
  ): Promise<void> {
    try {
      // Check if the secret already exists
      const secretName = secretManifest.metadata?.name;
      if (!secretName) {
        throw new Error('Secret name is undefined.');
      }
      const existingSecret = await this.getSecret(namespace, secretName);
      if (existingSecret) {
        this.logger.log(
          `Secret '${secretManifest.metadata?.name}' already exists in namespace '${namespace}'. Skipping creation.`,
        );
        return;
      }
    } catch (error) {
      if (this.isKubernetesError(error) && error.response?.statusCode !== 404) {
        this.logger.error(
          `Failed to check for secret existence in namespace '${namespace}': ${error.response?.body?.message || error.message}`,
        );
        throw error;
      }
    }

    try {
      await this.k8sCoreApi.createNamespacedSecret(namespace, secretManifest);
      this.logger.log(
        `Secret '${secretManifest.metadata?.name}' created successfully.`,
      );
    } catch (error) {
      this.handleKubernetesError(
        error,
        `Failed to create secret in namespace '${namespace}'`,
      );
    }
  }

  async getSecret(
    namespace: string,
    secretName: string,
  ): Promise<k8s.V1Secret | undefined> {
    try {
      return (await this.k8sCoreApi.readNamespacedSecret(secretName, namespace))
        .body;
    } catch (error) {
      this.handleKubernetesError(
        error,
        `Failed to get secret '${secretName}' in namespace '${namespace}'`,
      );
      return undefined;
    }
  }

  async createRole(namespace: string, roleManifest: k8s.V1Role): Promise<void> {
    try {
      await this.k8sRbacApi.createNamespacedRole(namespace, roleManifest);
      this.logger.log(
        `Role '${roleManifest.metadata?.name}' created successfully in namespace '${namespace}'.`,
      );
    } catch (error) {
      this.handleKubernetesError(
        error,
        `Failed to create role in namespace '${namespace}'`,
      );
    }
  }

  async createRoleBinding(
    namespace: string,
    roleBindingManifest: k8s.V1RoleBinding,
  ): Promise<void> {
    try {
      await this.k8sRbacApi.createNamespacedRoleBinding(
        namespace,
        roleBindingManifest,
      );
      this.logger.log(
        `RoleBinding '${roleBindingManifest.metadata?.name}' created successfully in namespace '${namespace}'.`,
      );
    } catch (error) {
      this.handleKubernetesError(
        error,
        `Failed to create role binding in namespace '${namespace}'`,
      );
    }
  }

  async namespaceExists(namespace: string): Promise<boolean> {
    try {
      await this.k8sCoreApi.readNamespace(namespace);
      return true;
    } catch (error) {
      if (this.isKubernetesError(error) && error.response?.statusCode === 404) {
        return false;
      }
      this.handleKubernetesError(
        error,
        `Error checking namespace existence '${namespace}'`,
      );
      return false;
    }
  }

  async deploymentExists(
    deploymentName: string,
    namespace: string,
  ): Promise<boolean> {
    try {
      await this.k8sAppsApi.readNamespacedDeployment(deploymentName, namespace);
      return true;
    } catch (error) {
      if (this.isKubernetesError(error) && error.response?.statusCode === 404) {
        return false;
      }
      this.handleKubernetesError(
        error,
        `Error checking deployment existence '${deploymentName}' in namespace '${namespace}'`,
      );
      return false; // Ensure a boolean is always returned
    }
  }

  async getServiceUrl(
    serviceName: string,
    namespace: string,
    serviceType: 'InfluxDB' | 'Grafana' | 'JMeterMaster' | 'JMeterSlave',
  ): Promise<string> {
    try {
      const servicePorts: { [key: string]: number } = {
        InfluxDB: 8086,
        Grafana: 32000,
        JMeterMaster: 1099,
        JMeterSlave: 50000,
      };

      // Use backticks for string interpolation
      return `http://localhost:${servicePorts[serviceType]}`;
    } catch (err) {
      // Narrow down the type of 'err' to Error
      if (err instanceof Error) {
        this.logger.error(
          `Failed to get service URL for '${serviceName}': ${err.message}`,
        );
        throw new Error(
          `Failed to get service URL for '${serviceName}': ${err.message}`,
        );
      } else {
        this.logger.error(`Unknown error: ${err}`);
        throw new Error(
          `Unknown error while getting service URL for '${serviceName}'.`,
        );
      }
    }
  }

  private isKubernetesError(error: unknown): error is KubernetesHttpError {
    return (
      error instanceof Error &&
      'response' in error &&
      (error as KubernetesHttpError).response instanceof IncomingMessage
    );
  }

  private handleKubernetesError(error: unknown, message: string): void {
    if (this.isKubernetesError(error)) {
      const response = (error as KubernetesHttpError).response;
      const statusCode = response?.statusCode;
      // Use the body property from the custom type
      const responseBody =
        response.body?.message || JSON.stringify(response.body);
      this.logger.error(
        `${message}: ${responseBody} (Status Code: ${statusCode})`,
      );
      throw new Error(
        `${message}: ${responseBody} (Status Code: ${statusCode})`,
      );
    } else if (error instanceof Error) {
      this.logger.error(`${message}: ${error.message}`);
      throw new Error(`${message}: ${error.message}`);
    } else {
      this.logger.error(`Unknown error: ${message}`, error);
      throw new Error(`Unknown error: ${message}`);
    }
  }
}
