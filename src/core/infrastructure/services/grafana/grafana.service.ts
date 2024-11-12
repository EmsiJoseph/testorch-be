// import {
//   forwardRef,
//   Inject,
//   Injectable,
//   Logger,
//   OnModuleInit,
// } from '@nestjs/common';
// import * as path from 'path';

// import { IGrafanaService } from '../../../application/interfaces/services/grafana.service.interface';
// import { generateStrongPassword } from '../../../shared/utils/utils';
// import { KubernetesService } from '../kubernetes/kubernetes.service';
// import { SetupService } from '../setup.service';

// @Injectable()
// export class GrafanaService implements IGrafanaService, OnModuleInit {
//   private readonly logger = new Logger(GrafanaService.name);

//   private grafanaUrl: string;
//   private grafanaUsername: string;
//   private grafanaPassword: string;
//   private namespace: string = 'monitoring'; // Default namespace

//   constructor(
//     @Inject(forwardRef(() => KubernetesService))
//     private readonly kubernetesService: KubernetesService,
//     private readonly setupService: SetupService,
//   ) {}

//   onModuleInit() {
//     this.logger.log(
//       'GrafanaService has been initialized and is ready to listen to events.',
//     );
//   }

//   async createGrafanaSecret(namespace: string): Promise<void> {
//     const secretName = 'grafana-env-secrets';
//     this.grafanaUsername = 'admin';
//     this.grafanaPassword = generateStrongPassword();

//     const secretData = {
//       GF_SECURITY_ADMIN_USER: this.grafanaUsername,
//       GF_SECURITY_ADMIN_PASSWORD: this.grafanaPassword,
//     };
//     await this.kubernetesService.createSecret(
//       secretName,
//       namespace,
//       secretData,
//     );
//   }

//   async deployGrafanaIfNotExists(): Promise<string> {
//     const grafanaYaml = path.join(
//       process.cwd(),
//       'src',
//       'static',
//       'deployments',
//       'grafana-deployment.yaml',
//     );
//     const namespace = this.namespace;
//     const deploymentName = 'grafana';
//     await this.createGrafanaSecret(namespace);

//     if (
//       await this.kubernetesService.deploymentExists(deploymentName, namespace)
//     ) {
//       this.logger.log(
//         'Grafana deployment already exists, skipping deployment.',
//       );
//       this.grafanaUrl = await this.kubernetesService.getDeploymentUrl(
//         deploymentName,
//         namespace,
//         'Grafana',
//       );
//       return 'Grafana already deployed';
//     }

//     await this.kubernetesService.deployResourceFromYaml(grafanaYaml, namespace);
//     this.grafanaUrl = await this.kubernetesService.getDeploymentUrl(
//       deploymentName,
//       namespace,
//       'Grafana',
//     );

//     // Store the credentials in the database
//     await this.setupService.storeGrafanaCredentials(
//       this.grafanaUsername,
//       this.grafanaPassword,
//     );

//     this.logger.log(`Grafana Deployment Information:
//       - URL: ${this.grafanaUrl}
//       - Username: ${this.grafanaUsername}
//       - Password: ${this.grafanaPassword}
//     `);
//     return 'Grafana deployed';
//   }

//   public async createDatasource(data: any): Promise<any> {
//     return `TODO ${data}`;
//   }

//   public async getDatasource(name: string): Promise<any> {
//     return `TODO ${name}`;
//   }

//   public async deleteDatasource(id: number): Promise<any> {
//     return `TODO ${id}`;
//   }

//   public async listDashboards(): Promise<any> {
//     return `TODO`;
//   }

//   public async createDashboard(dashboard: any): Promise<any> {
//     return `TODO ${dashboard}`;
//   }

//   public async getDashboard(name: string): Promise<any> {
//     return `TODO ${name}`;
//   }

//   public async deleteDashboard(id: number): Promise<any> {
//     return `TODO ${id}`;
//   }
// }
