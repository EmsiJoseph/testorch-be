// import {
//   forwardRef,
//   Inject,
//   Injectable,
//   Logger
// } from '@nestjs/common';
// import { exec } from 'child_process'; // Import exec from child_process
// import { spawn } from 'env-cmd/dist/spawn';
// import fs, { existsSync, promises as fsPromises } from 'fs';
// import * as path from 'path'; // Ensure path is imported correctly
// import { promisify } from 'util'; // Import promisify from util
// import { IKubernetesService } from '../../../application/interfaces/services/kubernetes.service.interface';
// import { KubernetesHttpError } from '../../../domain/errors/common';
// import { KubernetesClient } from '../../client/kubernetes-client';
// import { GrafanaService } from '../grafana/grafana.service';
// import { InfluxdbService } from '../influxdb/influxdb.service';
// import { JmeterService } from '../jmeter/jmeter.service';

// @Injectable()
// export class KubernetesService implements IKubernetesService {
//   private readonly logger = new Logger(KubernetesService.name);

//   // Injecting required services in the constructor
//   constructor(
//     @Inject(forwardRef(() => InfluxdbService))

//     @Inject(forwardRef(() => GrafanaService)) // Use forwardRef for circular dependencies
//     private readonly grafanaService: GrafanaService,
//     private readonly kubernetesClient: KubernetesClient,
//     private readonly jmeterService: JmeterService,
//   ) {}

//   async initializeDeployments(): Promise<void> {
//     // Deploy Grafana
//     await this.grafanaService.deployGrafanaIfNotExists();

//     // Deploy InfluxDB
//     await this.influxdbService.deployInfluxdbIfNotExists();

//     // Deploy JMeter (Master and Slaves)
//     // await this.jmeterService.deployJmeterMasterIfNotExists();
//     // await this.jmeterService.deployJmeterSlavesIfNotExists();
//     await this.portForwardResource('influxdb', '8086', 'monitoring');
//     await this.portForwardResource('grafana', '3000', 'monitoring');

//     this.logger.log('All deployments have been successfully initialized.');
//   }

//   async createNamespaceIfNotExists(namespace: string): Promise<void> {
//     try {
//       await this.kubernetesClient.k8sCoreApi.readNamespace(namespace);
//       this.logger.log(
//         `Namespace ${namespace} already exists, skipping creation.`,
//       );
//     } catch (err) {
//       if (this.isKubernetesHttpError(err) && err.response?.statusCode === 404) {
//         this.logger.log(`Creating namespace ${namespace}...`);
//         await this.kubernetesClient.k8sCoreApi.createNamespace({
//           metadata: { name: namespace },
//         });
//         this.logger.log(`Namespace ${namespace} created.`);
//       } else {
//         const errorMessage = this.getErrorMessage(err);
//         this.logger.error(`Error checking/creating namespace: ${errorMessage}`);
//         throw new Error(`Error checking/creating namespace: ${errorMessage}`);
//       }
//     }
//   }

//   public async createSecret(
//     secretName: string,
//     namespace: string,
//     secretData: Record<string, string>,
//   ): Promise<void> {
//     try {
//       await this.kubernetesClient.k8sCoreApi.readNamespacedSecret(
//         secretName,
//         namespace,
//       );
//       this.logger.log(
//         `Secret '${secretName}' already exists, skipping creation.`,
//       );
//     } catch (err) {
//       if (this.isKubernetesHttpError(err) && err.response?.statusCode === 404) {
//         this.logger.log(
//           `Creating Secret '${secretName}' in namespace '${namespace}'...`,
//         );
//         const secretManifest = {
//           apiVersion: 'v1',
//           kind: 'Secret',
//           metadata: { name: secretName, namespace },
//           data: Object.fromEntries(
//             Object.entries(secretData).map(([key, value]) => [
//               key,
//               Buffer.from(value).toString('base64'),
//             ]),
//           ),
//         };
//         await this.kubernetesClient.k8sCoreApi.createNamespacedSecret(
//           namespace,
//           secretManifest,
//         );
//         this.logger.log(
//           `Secret '${secretName}' created successfully with generated credentials.`,
//         );
//       } else {
//         const errorMessage = this.getErrorMessage(err);
//         this.logger.error(`Failed to check/create secret: ${errorMessage}`);
//         throw new Error(`Failed to create secret: ${errorMessage}`);
//       }
//     }
//   }

//   public async getSecret(secretName: string, namespace: string): Promise<any> {
//     try {
//       const response =
//         await this.kubernetesClient.k8sCoreApi.readNamespacedSecret(
//           secretName,
//           namespace,
//         );
//       this.logger.log(`Successfully retrieved secret '${secretName}'`);
//       return response.body;
//     } catch (err) {
//       const errorMessage = this.getErrorMessage(err);
//       this.logger.error(
//         `Failed to get secret '${secretName}': ${errorMessage}`,
//       );
//       throw new Error(`Failed to get secret '${secretName}': ${errorMessage}`);
//     }
//   }

//   public async getDeploymentUrl(
//     serviceName: string,
//     namespace: string,
//     serviceType: 'InfluxDB' | 'Grafana' | 'JMeterMaster' | 'JMeterSlave',
//   ): Promise<string> {
//     try {
//       // Define port mapping for different services
//       const servicePorts: { [key: string]: number } = {
//         InfluxDB: 8086, // Default port for InfluxDB
//         Grafana: 32000, // Default port for Grafana
//         JMeterMaster: 1099, // Default port for JMeter Master (example)
//         JMeterSlave: 50000, // Default port for JMeter Slave (example)
//       };

//       // Get the port based on the service type
//       const port = servicePorts[serviceType] || 80; // Default to port 80 if not specified

//       return `http://localhost:${port}`;
//     } catch (err) {
//       const errorMessage = this.getErrorMessage(err);
//       this.logger.error(`Failed to get ${serviceName} URL: ${errorMessage}`);
//       throw new Error(`Failed to get ${serviceName} URL: ${errorMessage}`);
//     }
//   }

//   public async deployResourceFromYaml(
//     yamlFilePath: string,
//     namespace: string,
//   ): Promise<string> {
//     const execPromise = promisify(exec);

//     if (!existsSync(yamlFilePath)) {
//       throw new Error(`YAML file not found: ${yamlFilePath}`);
//     }

//     const quotedYamlFilePath = `"${yamlFilePath}"`;
//     try {
//       const { stdout, stderr } = await execPromise(
//         `kubectl apply -f ${quotedYamlFilePath} --namespace=${namespace}`,
//       );
//       if (stderr) {
//         this.logger.error(
//           `Error deploying resource from ${yamlFilePath}: ${stderr}`,
//         );
//         throw new Error(`Deployment failed: ${stderr.trim()}`);
//       }
//       this.logger.log(`Resource deployed from ${yamlFilePath}: ${stdout}`);
//       return stdout;
//     } catch (error) {
//       const errorMessage = this.getErrorMessage(error);
//       this.logger.error(
//         `Failed to deploy resource from ${yamlFilePath}: ${errorMessage}`,
//       );
//       throw new Error(`Deployment Error: ${errorMessage}`);
//     }
//   }

//   public async portForwardResource(
//     serviceName: string,
//     port: string,
//     namespace: string,
//   ): Promise<void> {
//     const maxRetries = 10; // Maximum number of retries
//     const delay = 5000; // Delay between retries in ms (5 seconds)

//     let podReady = false;
//     for (let attempt = 0; attempt < maxRetries; attempt++) {
//       podReady = await this.checkPodReady(serviceName, namespace);
//       if (podReady) break;

//       this.logger.log(
//         `Waiting for pod ${serviceName} to be ready... (Attempt ${attempt + 1})`,
//       );
//       await new Promise((resolve) => setTimeout(resolve, delay)); // Wait before retrying
//     }

//     if (!podReady) {
//       throw new Error(
//         `Pod ${serviceName} in namespace ${namespace} is not ready after ${maxRetries} attempts`,
//       );
//     }

//     try {
//       const portForwardProcess = spawn('kubectl', [
//         'port-forward',
//         `svc/${serviceName}`,
//         `${port}:${port}`,
//         `--namespace=${namespace}`,
//       ]);

//       portForwardProcess.stdout.on('data', (data) => {
//         this.logger.log(`Port-forward output for ${serviceName}: ${data}`);
//       });

//       portForwardProcess.stderr.on('data', (data) => {
//         this.logger.error(`Port-forward error for ${serviceName}: ${data}`);
//       });

//       portForwardProcess.on('error', (error) => {
//         this.logger.error(
//           `Failed to start port-forward for ${serviceName}: ${error.message}`,
//         );
//       });

//       portForwardProcess.on('close', (code) => {
//         if (code !== 0) {
//           this.logger.error(
//             `Port-forward process for ${serviceName} exited with code ${code}`,
//           );
//         } else {
//           this.logger.log(
//             `Port-forward process for ${serviceName} exited successfully.`,
//           );
//         }
//       });
//     } catch (error) {
//       const errorMessage = this.getErrorMessage(error);
//       this.logger.error(
//         `Error starting port-forward for ${serviceName}: ${errorMessage}`,
//       );
//       throw new Error(`Port-forwarding Error: ${errorMessage}`);
//     }
//   }

//   public async deploymentExists(
//     deploymentName: string,
//     namespace: string,
//   ): Promise<boolean> {
//     try {
//       await this.kubernetesClient.k8sAppsApi.readNamespacedDeployment(
//         deploymentName,
//         namespace,
//       );
//       return true;
//     } catch (err) {
//       if (this.isKubernetesHttpError(err) && err.response?.statusCode === 404) {
//         return false;
//       }
//       const errorMessage = this.getErrorMessage(err);
//       this.logger.error(
//         `Error checking deployment ${deploymentName} in namespace ${namespace}: ${errorMessage}`,
//       );
//       throw err;
//     }
//   }
//   public async checkJmeterStatus(): Promise<{
//     master: boolean;
//     workers: boolean;
//   }> {
//     const masterStatus = await this.checkPodReady(
//       'jmeter-master',
//       'perf-platform',
//     );
//     const workerStatus = await this.checkPodReady(
//       'jmeter-slave',
//       'perf-platform',
//     );
//     return { master: masterStatus, workers: workerStatus };
//   }

//   public async waitForPodReady(
//     serviceName: string,
//     namespace: string,
//     timeout: number = 300000,
//   ): Promise<void> {
//     const start = Date.now();
//     while (Date.now() - start < timeout) {
//       const podReady = await this.checkPodReady(serviceName, namespace);
//       if (podReady) {
//         return;
//       }
//       this.logger.log(`Waiting for pod ${serviceName} to be ready...`);
//       await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for 5 seconds before checking again
//     }
//     throw new Error(
//       `Pod ${serviceName} in namespace ${namespace} is not ready after ${timeout / 1000} seconds`,
//     );
//   }

//   private async checkPodReady(
//     serviceName: string,
//     namespace: string,
//   ): Promise<boolean> {
//     try {
//       const { body } = await this.kubernetesClient.k8sCoreApi.listNamespacedPod(
//         namespace,
//         undefined,
//         undefined,
//         undefined,
//         undefined,
//         `app=${serviceName}`,
//       );
//       const pod = body.items.find((pod) => pod.status?.phase === 'Running');
//       return !!pod;
//     } catch (error) {
//       this.logger.error(
//         `Error checking pod status for ${serviceName}: ${this.getErrorMessage(error)}`,
//       );
//       return false;
//     }
//   }

//   public async createConfigMapFromFile(
//     filePath: string,
//     configMapName: string,
//   ): Promise<void> {
//     const fileContent = await fsPromises.readFile(filePath, 'utf-8');
//     const configMapYaml = {
//       apiVersion: 'v1',
//       kind: 'ConfigMap',
//       metadata: {
//         name: configMapName,
//       },
//       data: {
//         'test.jmx': fileContent, // Ensure the key matches the file name used in the container
//       },
//     };

//     try {
//       // Check if the ConfigMap already exists
//       await this.kubernetesClient.k8sCoreApi.readNamespacedConfigMap(
//         configMapName,
//         'perf-platform',
//       );
//       this.logger.log(
//         `ConfigMap '${configMapName}' already exists, updating it...`,
//       );

//       // Update the existing ConfigMap
//       await this.kubernetesClient.k8sCoreApi.replaceNamespacedConfigMap(
//         configMapName,
//         'perf-platform',
//         configMapYaml,
//       );
//       this.logger.log(
//         `ConfigMap '${configMapName}' updated in namespace 'perf-platform'`,
//       );
//     } catch (err) {
//       if (this.isKubernetesHttpError(err) && err.response?.statusCode === 404) {
//         // ConfigMap does not exist, create a new one
//         const response =
//           await this.kubernetesClient.k8sCoreApi.createNamespacedConfigMap(
//             'perf-platform',
//             configMapYaml,
//           );
//         this.logger.log(
//           `ConfigMap '${configMapName}' created in namespace 'perf-platform'`,
//         );
//         this.logger.log(`Response: ${JSON.stringify(response.body)}`);
//       } else {
//         const errorMessage = this.getErrorMessage(err);
//         this.logger.error(`Failed to create/update ConfigMap: ${errorMessage}`);
//         throw new Error(`Failed to create/update ConfigMap: ${errorMessage}`);
//       }
//     }
//   }

//   public async deployResourceWithConfigMap(
//     yamlPath: string,
//     configMapName: string,
//     namespace: string,
//   ): Promise<void> {
//     const deploymentYaml = fs
//       .readFileSync(yamlPath, 'utf-8')
//       .replace('CONFIG_MAP_NAME', configMapName);
//     await this.deployResourceFromYaml(deploymentYaml, namespace);
//   }

//   public async getPodLogs(podName: string, namespace: string): Promise<string> {
//     try {
//       const { stdout, stderr } = await promisify(exec)(
//         `kubectl logs ${podName} --namespace=${namespace}`,
//       );
//       if (stderr) {
//         this.logger.error(`Error fetching logs for pod ${podName}: ${stderr}`);
//         throw new Error(`Failed to fetch logs: ${stderr.trim()}`);
//       }
//       return stdout;
//     } catch (error) {
//       const errorMessage = this.getErrorMessage(error);
//       this.logger.error(
//         `Failed to fetch logs for pod ${podName}: ${errorMessage}`,
//       );
//       throw new Error(`Failed to fetch logs: ${errorMessage}`);
//     }
//   }

//   public async getPodName(
//     serviceName: string,
//     namespace: string,
//   ): Promise<string> {
//     try {
//       const { body } = await this.kubernetesClient.k8sCoreApi.listNamespacedPod(
//         namespace,
//         undefined,
//         undefined,
//         undefined,
//         undefined,
//         `app=${serviceName}`,
//       );
//       const pod = body.items.find((pod) => pod.status?.phase === 'Running');
//       if (!pod) {
//         throw new Error(
//           `Pod for service ${serviceName} not found in namespace ${namespace}`,
//         );
//       }
//       return pod.metadata?.name || '';
//     } catch (error) {
//       const errorMessage = this.getErrorMessage(error);
//       this.logger.error(
//         `Failed to get pod name for service ${serviceName}: ${errorMessage}`,
//       );
//       throw new Error(`Failed to get pod name: ${errorMessage}`);
//     }
//   }

//   public async deleteAndRedeployJmeterMaster(): Promise<void> {
//     const namespace = 'perf-platform';
//     const deploymentName = 'jmeter-master';
//     const serviceName = 'jmeter-master';

//     try {
//       // Delete the deployment
//       await this.kubernetesClient.k8sAppsApi.deleteNamespacedDeployment(
//         deploymentName,
//         namespace,
//       );
//       this.logger.log(
//         `Deleted deployment ${deploymentName} in namespace ${namespace}`,
//       );

//       // Delete the service
//       await this.kubernetesClient.k8sCoreApi.deleteNamespacedService(
//         serviceName,
//         namespace,
//       );
//       this.logger.log(
//         `Deleted service ${serviceName} in namespace ${namespace}`,
//       );

//       // Redeploy the resources
//       const jmeterMasterYaml = path.join(
//         process.cwd(),
//         'src',
//         'static',
//         'deployments',
//         'jmeter-master-deployment.yaml',
//       );
//       await this.deployResourceFromYaml(jmeterMasterYaml, namespace);
//       this.logger.log(`Redeployed ${deploymentName} in namespace ${namespace}`);
//     } catch (error) {
//       const errorMessage = this.getErrorMessage(error);
//       this.logger.error(
//         `Failed to delete and redeploy ${deploymentName}: ${errorMessage}`,
//       );
//       throw new Error(
//         `Failed to delete and redeploy ${deploymentName}: ${errorMessage}`,
//       );
//     }
//   }

//   public async getPodStatus(
//     podName: string,
//     namespace: string,
//   ): Promise<string> {
//     try {
//       const { body } =
//         await this.kubernetesClient.k8sCoreApi.readNamespacedPodStatus(
//           podName,
//           namespace,
//         );
//       return body.status?.phase || 'Unknown';
//     } catch (error) {
//       const errorMessage = this.getErrorMessage(error);
//       this.logger.error(
//         `Failed to get status for pod ${podName}: ${errorMessage}`,
//       );
//       throw new Error(
//         `Failed to get status for pod ${podName}: ${errorMessage}`,
//       );
//     }
//   }

//   public async editDeploymentYaml(
//     yamlFilePath: string,
//     filePath: string,
//     mountPath: string,
//   ): Promise<void> {
//     try {
//       let yamlContent = await fsPromises.readFile(yamlFilePath, 'utf-8');
//       const formattedFilePath = path
//         .join(mountPath, path.basename(filePath))
//         .replace(/\\/g, '/'); // Ensure correct path formatting for Windows
//       yamlContent = yamlContent.replace(
//         /\/path\/to\/your\/uploads\/directory/g,
//         mountPath,
//       );
//       yamlContent = yamlContent.replace(
//         /\/uploads\/blazeDemoTest.jmx/g,
//         formattedFilePath,
//       );
//       yamlContent = yamlContent.replace(
//         /value: "\/uploads\/blazeDemoTest.jmx"/g,
//         `value: "${formattedFilePath}"`,
//       );
//       await fsPromises.writeFile(yamlFilePath, yamlContent, 'utf-8');
//       this.logger.log(`Edited deployment YAML file: ${yamlFilePath}`);
//       await new Promise((resolve) => setTimeout(resolve, 1000)); // Add delay to wait for file to be saved
//     } catch (error) {
//       const errorMessage = this.getErrorMessage(error);
//       this.logger.error(`Failed to edit deployment YAML file: ${errorMessage}`);
//       throw new Error(`Failed to edit deployment YAML file: ${errorMessage}`);
//     }
//   }

//   public async getPodsByLabel(
//     label: string,
//     namespace: string,
//   ): Promise<any[]> {
//     try {
//       const { body } = await this.kubernetesClient.k8sCoreApi.listNamespacedPod(
//         namespace,
//         undefined,
//         undefined,
//         undefined,
//         undefined,
//         label,
//       );
//       return body.items;
//     } catch (error) {
//       const errorMessage = this.getErrorMessage(error);
//       this.logger.error(
//         `Failed to get pods by label ${label}: ${errorMessage}`,
//       );
//       throw new Error(`Failed to get pods by label ${label}: ${errorMessage}`);
//     }
//   }

//   public async deleteDeployment(
//     deploymentName: string,
//     namespace: string,
//   ): Promise<void> {
//     try {
//       await this.kubernetesClient.k8sAppsApi.deleteNamespacedDeployment(
//         deploymentName,
//         namespace,
//       );
//       this.logger.log(
//         `Deleted deployment ${deploymentName} in namespace ${namespace}`,
//       );
//     } catch (error) {
//       const errorMessage = this.getErrorMessage(error);
//       this.logger.error(
//         `Failed to delete deployment ${deploymentName} in namespace ${namespace}: ${errorMessage}`,
//       );
//       throw new Error(
//         `Failed to delete deployment ${deploymentName} in namespace ${namespace}: ${errorMessage}`,
//       );
//     }
//   }

//   private isKubernetesHttpError(error: unknown): error is KubernetesHttpError {
//     return (
//       error instanceof Error &&
//       'response' in error &&
//       (error as KubernetesHttpError).response?.statusCode !== undefined
//     );
//   }

//   private getErrorMessage(error: unknown): string {
//     if (error instanceof Error) {
//       return error.message;
//     }
//     if (this.isKubernetesHttpError(error)) {
//       return (
//         error.response?.body?.message || JSON.stringify(error.response?.body)
//       );
//     }
//     return 'Unknown error occurred';
//   }
// }
