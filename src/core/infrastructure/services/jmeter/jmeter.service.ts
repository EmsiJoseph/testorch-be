// import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { promises as fsPromises } from 'fs'; // Import fs.promises correctly
// import * as path from 'path';
// import { IJmeterService } from '../../../application/interfaces/services/jmeter.service.interface';
// import { KubernetesService } from '../kubernetes/kubernetes.service';
// import { JmeterGateway } from './jmeter.gateway';

// @Injectable()
// export class JmeterService implements IJmeterService {
//   private readonly logger = new Logger(JmeterService.name);
//   private namespace: string = 'perf-platform';
//   constructor(
//     @Inject(forwardRef(() => KubernetesService))
//     private readonly kubernetesService: KubernetesService,
//     private readonly configService: ConfigService,
//     private readonly jmeterGateway: JmeterGateway,
//   ) {}
//   /**
//    * Deploy JMeter Master using the YAML file if not already deployed.
//    */
//   async deployJmeterMasterIfNotExists(): Promise<string> {
//     const jmeterMasterYaml = path.join(
//       process.cwd(),
//       'src',
//       'static',
//       'deployments',
//       'jmeter-master-deployment.yaml',
//     );

//     this.logger.log('JMETER MASTER YAML PATH: ' + jmeterMasterYaml);

//     const namespace = this.namespace;

//     // Check if JMeter Master deployment already exists
//     if (
//       await this.kubernetesService.deploymentExists('jmeter-master', namespace)
//     ) {
//       this.logger.log(
//         'JMeter Master deployment already exists, skipping deployment.',
//       );
//       return 'JMeter Master already deployed';
//     }

//     await this.kubernetesService.deployResourceFromYaml(
//       jmeterMasterYaml,
//       namespace,
//     );

//     return 'JMeter Master deployed';
//   }

//   /**
//    * Deploy JMeter Slaves using the YAML file if not already deployed.
//    */
//   async deployJmeterSlavesIfNotExists(): Promise<string> {
//     this.logger.log(
//       "Received 'kubernetes.init' event, deploying Jmeter Slaves...",
//     );
//     const jmeterSlaveYaml = path.join(
//       process.cwd(),
//       'src',
//       'static',
//       'deployments',
//       'jmeter-slave-deployment.yaml',
//     );

//     const namespace = this.namespace;

//     // Check if JMeter Slaves deployment already exists
//     if (
//       await this.kubernetesService.deploymentExists('jmeter-slave', namespace)
//     ) {
//       this.logger.log(
//         'JMeter Slaves deployment already exists, skipping deployment.',
//       );
//       return 'JMeter Slaves already deployed';
//     }

//     await this.kubernetesService.deployResourceFromYaml(
//       jmeterSlaveYaml,
//       namespace,
//     );
//     return 'JMeter Slaves deployed';
//   }

//   public async startTest(filePath: string, workerNodes: number): Promise<any> {
//     // Download the JMX file
//     // const jmxFilePath = await this.downloadJmxFile(jmxUrl);

//     // Add InfluxDB backend listener to JMX file

//     // Create ConfigMap from modified JMX file
//     const configMapName = 'jmeter-test-plan';
//     try {
//       await this.kubernetesService.createConfigMapFromFile(
//         filePath,
//         configMapName,
//       );
//       this.jmeterGateway.sendProgressUpdate('Preparing test ');
//     } catch (error) {
//       this.logger.error(`Failed to create ConfigMap: ${error.message}`);
//       throw new Error(`Failed to create ConfigMap: ${error.message}`);
//     }

//     // Edit and Deploy JMeter Master
//     const jmeterMasterYaml = path.join(
//       process.cwd(),
//       'src',
//       'static',
//       'deployments',
//       'jmeter-master-deployment.yaml',
//     );
//     await this.kubernetesService.editDeploymentYaml(
//       jmeterMasterYaml,
//       filePath,
//       '/uploads',
//     );
//     this.jmeterGateway.sendPodStatusUpdate({
//       id: null,
//       type: 'controller',
//       status: this.mapPodStatusToStep('Pending'),
//     });
//     await this.deployJmeterMasterIfNotExists();
//     this.jmeterGateway.sendProgressUpdate('Controller deployed');

//     // Edit and Deploy JMeter Slaves
//     const jmeterSlaveYaml = path.join(
//       process.cwd(),
//       'src',
//       'static',
//       'deployments',
//       'jmeter-slave-deployment.yaml',
//     );
//     await this.kubernetesService.editDeploymentYaml(
//       jmeterSlaveYaml,
//       filePath,
//       '/uploads',
//     );
//     for (let i = 0; i < workerNodes; i++) {
//       this.jmeterGateway.sendPodStatusUpdate({
//         id: null,
//         type: `worker ${i + 1}`,
//         status: this.mapPodStatusToStep('Pending'),
//       });
//       await this.deployJmeterSlavesIfNotExists();
//       this.jmeterGateway.sendProgressUpdate(`Worker ${i + 1} deployed`);
//     }

//     // Wait for JMeter Master and Slaves to be ready
//     await this.kubernetesService.waitForPodReady(
//       'jmeter-master',
//       this.namespace,
//     );
//     for (let i = 0; i < workerNodes; i++) {
//       await this.kubernetesService.waitForPodReady(
//         'jmeter-slave',
//         this.namespace,
//       );
//     }

//     // Emit pod status updates
//     const masterPodName = await this.kubernetesService.getPodName(
//       'jmeter-master',
//       this.namespace,
//     );
//     const masterPodStatus = await this.kubernetesService.getPodStatus(
//       masterPodName,
//       this.namespace,
//     );
//     this.jmeterGateway.sendPodStatusUpdate({
//       id: masterPodName,
//       type: 'controller',
//       status: this.mapPodStatusToStep(masterPodStatus),
//     });

//     const slavePods = await this.kubernetesService.getPodsByLabel(
//       'app=jmeter-slave',
//       this.namespace,
//     );
//     for (const pod of slavePods) {
//       const podStatus = await this.kubernetesService.getPodStatus(
//         pod.metadata.name,
//         this.namespace,
//       );
//       this.jmeterGateway.sendPodStatusUpdate({
//         id: pod.metadata.name,
//         type: 'worker',
//         status: this.mapPodStatusToStep(podStatus),
//       });
//     }

//     // Check if JMeter Master is in CrashLoopBackOff state and redeploy if necessary
//     if (masterPodStatus === 'CrashLoopBackOff') {
//       this.logger.log(
//         'JMeter Master is in CrashLoopBackOff state, redeploying...',
//       );
//       await this.kubernetesService.deleteAndRedeployJmeterMaster();
//       await this.kubernetesService.waitForPodReady(
//         'jmeter-master',
//         this.namespace,
//       );
//     }

//     // Start the test using the JMX file
//     // Implement logic to start the test using the JMX file
//     this.jmeterGateway.sendProgressUpdate('Test started');

//     const status = await this.kubernetesService.checkJmeterStatus();
//     this.jmeterGateway.sendPodStatusUpdate({
//       id: masterPodName,
//       type: 'controller',
//       status: status.master ? 'Master running' : 'Master not running',
//     });
//     console.log(status);

//     // Fetch logs and results after the test
//     const masterPodLogs = await this.kubernetesService.getPodLogs(
//       masterPodName,
//       this.namespace,
//     );
//     this.jmeterGateway.sendProgressUpdate('Master Pod Logs:\n' + masterPodLogs);

//     console.log(masterPodLogs);

//     const results = await this.checkTestResults();
//     this.jmeterGateway.sendProgressUpdate('Test Results:\n' + results);

//     return { filePath, workerNodes, results };
//   }

//   // private async downloadJmxFile(jmxUrl: string): Promise<string> {
//   //   const response = await lastValueFrom(
//   //     this.httpService.get(jmxUrl, { responseType: 'arraybuffer' }),
//   //   );
//   //   const jmxFilePath = path.join(
//   //     process.cwd(),
//   //     'src',
//   //     'static',
//   //     'jmx',
//   //     'test.jmx',
//   //   );
//   //   await fs.promises.writeFile(jmxFilePath, response.data);
//   //   return jmxFilePath;
//   // }

//   async addInfluxDBListener(
//     fileBase64: string,
//     influxDbApiToken: string,
//     influxDbUrl: string,
//     organization: string,
//     bucket: string,
//   ): Promise<string> {
//     console.log(
//       'Adding InfluxDB Listener',
//       `${influxDbUrl}/api/v2/write?org=${organization}&bucket=${bucket}&precision=ms`,
//     );
//     const backendListenerXML = `
//     <BackendListener guiclass="BackendListenerGui" testclass="BackendListener" testname="InfluxDB Backend Listener" enabled="true">
//       <elementProp name="arguments" elementType="Arguments">
//         <collectionProp name="Arguments.arguments">
//           <elementProp name="influxdbUrl" elementType="Argument">
//             <stringProp name="Argument.name">influxdbUrl</stringProp>
//             <stringProp name="Argument.value">${influxDbUrl}/api/v2/write?org=${organization}&bucket=${bucket}&precision=ns</stringProp>
//           </elementProp>
//           <elementProp name="influxdbToken" elementType="Argument">
//             <stringProp name="Argument.name">influxdbToken</stringProp>
//             <stringProp name="Argument.value">${influxDbApiToken}</stringProp>
//           </elementProp>
//           <elementProp name="application" elementType="Argument">
//             <stringProp name="Argument.name">application</stringProp>
//             <stringProp name="Argument.value">${bucket}</stringProp>
//           </elementProp>
//           <elementProp name="measurement" elementType="Argument">
//             <stringProp name="Argument.name">measurement</stringProp>
//             <stringProp name="Argument.value">${bucket}</stringProp>
//           </elementProp>
//         </collectionProp>
//       </elementProp>
//       <stringProp name="classname">org.apache.jmeter.visualizers.backend.influxdb.InfluxdbBackendListenerClient</stringProp>
//     </BackendListener>
//     <hashTree/>`;

//     // Decode the base64 content
//     const decodedFile = Buffer.from(fileBase64, 'base64').toString('utf-8');

//     // Insert the backend listener XML into the JMX file
//     const modifiedFile = decodedFile.replace(
//       /<\/hashTree>\s*<\/jmeterTestPlan>/,
//       `${backendListenerXML}\n</hashTree>\n</jmeterTestPlan>`,
//     );

//     // Encode the modified file back to base64
//     const modifiedFileBase64 = Buffer.from(modifiedFile).toString('base64');

//     // Return the modified base64 content
//     return modifiedFileBase64;
//   }

//   public async checkTestResults(): Promise<string> {
//     const resultsFilePath = path.join(
//       process.cwd(),
//       'src',
//       'static',
//       'results',
//       'results.csv',
//     );
//     try {
//       const results = await fsPromises.readFile(resultsFilePath, 'utf-8');
//       return results;
//     } catch (error) {
//       this.logger.error(`Failed to read results file: ${error.message}`);
//       throw new Error(`Failed to read results file: ${error.message}`);
//     }
//   }

//   private mapPodStatusToStep(status: string): string {
//     switch (status) {
//       case 'Pending':
//         return 'Launching';
//       case 'Running':
//         return 'Running';
//       case 'Succeeded':
//       case 'Failed':
//       case 'Unknown':
//         return 'Executing test';
//       default:
//         return 'Unknown';
//     }
//   }

//   async formatAndDeployJmeterYamls(
//     fileName: string,
//     jmxUrl: string,
//     workerNodes: number,
//   ): Promise<void> {
//     this.jmeterGateway.sendProgressUpdate(`Preparing your test`);
//     const jmeterMasterYamlTemplate = path.join(
//       process.cwd(),
//       'src',
//       'static',
//       'deployments',
//       'jmeter-master-deployment.yaml',
//     );
//     const jmeterSlaveYamlTemplate = path.join(
//       process.cwd(),
//       'src',
//       'static',
//       'deployments',
//       'jmeter-slave-deployment.yaml',
//     );

//     const jmeterMasterYaml = path.join(
//       process.cwd(),
//       'src',
//       'static',
//       'deployments',
//       `jmeter-master-deployment-${Date.now()}.yaml`,
//     );
//     const jmeterSlaveYaml = path.join(
//       process.cwd(),
//       'src',
//       'static',
//       'deployments',
//       `jmeter-slave-deployment-${Date.now()}.yaml`,
//     );

//     this.jmeterGateway.sendProgressUpdate(`Creating deployment YAML files`);

//     await this.createDeploymentYaml(
//       jmeterMasterYamlTemplate,
//       jmeterMasterYaml,
//       fileName,
//       jmxUrl,
//     );
//     await this.createDeploymentYaml(
//       jmeterSlaveYamlTemplate,
//       jmeterSlaveYaml,
//       fileName,
//       jmxUrl,
//     );

//     this.jmeterGateway.sendProgressUpdate(`Launching Controller`);

//     await this.kubernetesService.deployResourceFromYaml(
//       jmeterMasterYaml,
//       this.namespace,
//     );

//     // Wait for JMeter Master to be ready
//     await this.kubernetesService.waitForPodReady(
//       'jmeter-master',
//       this.namespace,
//     );

//     this.jmeterGateway.sendProgressUpdate(`Controller is running`);

//     for (let i = 0; i < workerNodes; i++) {
//       this.jmeterGateway.sendProgressUpdate(`Launching Worker ${i + 1}`);
//       await this.kubernetesService.deployResourceFromYaml(
//         jmeterSlaveYaml,
//         this.namespace,
//       );
//     }

//     // Emit pod status updates
//     const masterPodName = await this.kubernetesService.getPodName(
//       'jmeter-master',
//       this.namespace,
//     );
//     const masterPodStatus = await this.kubernetesService.getPodStatus(
//       masterPodName,
//       this.namespace,
//     );
//     this.jmeterGateway.sendPodStatusUpdate({
//       id: masterPodName,
//       type: 'controller',
//       status: this.mapPodStatusToStep(masterPodStatus),
//     });

//     const slavePods = await this.kubernetesService.getPodsByLabel(
//       'app=jmeter-slave',
//       this.namespace,
//     );
//     for (const pod of slavePods) {
//       const podStatus = await this.kubernetesService.getPodStatus(
//         pod.metadata.name,
//         this.namespace,
//       );
//       this.jmeterGateway.sendPodStatusUpdate({
//         id: pod.metadata.name,
//         type: 'worker',
//         status: this.mapPodStatusToStep(podStatus),
//       });
//     }
//     this.jmeterGateway.sendProgressUpdate(`All pods launched`);

//     // Delete the temporary YAML files
//     await fsPromises.unlink(jmeterMasterYaml);
//     await fsPromises.unlink(jmeterSlaveYaml);
//   }

//   private async createDeploymentYaml(
//     templatePath: string,
//     outputPath: string,
//     fileName: string,
//     jmxUrl: string,
//   ): Promise<void> {
//     const yamlContent = await fsPromises.readFile(templatePath, 'utf-8');

//     const formattedYaml = yamlContent
//       .replace(/PLACEHOLDER_JMX_URL/, jmxUrl)
//       .replace(/PLACEHOLDER_FILE_NAME/, fileName);

//     await fsPromises.writeFile(outputPath, formattedYaml, 'utf-8');
//   }

//   async deleteJmeterDeployments(): Promise<void> {
//     const namespace = this.namespace;
//     try {
//       await this.kubernetesService.deleteDeployment('jmeter-master', namespace);
//       await this.kubernetesService.deleteDeployment('jmeter-slave', namespace);
//       this.logger.log('Deleted JMeter master and slave deployments.');
//     } catch (error) {
//       this.logger.error(
//         `Failed to delete JMeter deployments: ${error.message}`,
//       );
//       throw new Error(`Failed to delete JMeter deployments: ${error.message}`);
//     }
//   }

//   async deleteJmeterDeploymentsIfExists(): Promise<void> {
//     const namespace = this.namespace;
//     try {
//       if (
//         await this.kubernetesService.deploymentExists(
//           'jmeter-master',
//           namespace,
//         )
//       ) {
//         await this.kubernetesService.deleteDeployment(
//           'jmeter-master',
//           namespace,
//         );
//         this.logger.log('Deleted JMeter master deployment.');
//       }
//       if (
//         await this.kubernetesService.deploymentExists('jmeter-slave', namespace)
//       ) {
//         await this.kubernetesService.deleteDeployment(
//           'jmeter-slave',
//           namespace,
//         );
//         this.logger.log('Deleted JMeter slave deployments.');
//       }
//     } catch (error) {
//       this.logger.error(
//         `Failed to delete JMeter deployments: ${error.message}`,
//       );
//       throw new Error(`Failed to delete JMeter deployments: ${error.message}`);
//     }
//   }
// }
