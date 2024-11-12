// import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
// import { Server } from 'socket.io';
// import { forwardRef, Inject, Injectable } from '@nestjs/common';
// import { KubernetesService } from '../kubernetes/kubernetes.service';

// @Injectable()
// @WebSocketGateway({
//   cors: {
//     origin: 'https://testorch.com:8443', // Replace with your frontend URL
//     methods: ['GET', 'POST'],
//     allowedHeaders: ['Content-Type'],
//     credentials: true, // Include credentials if needed
//   },
// })
// export class JmeterGateway {
//   constructor(
//     @Inject(forwardRef(() => KubernetesService))
//     private readonly kubernetesService: KubernetesService,
//   ) {}

//   @WebSocketServer()
//   server: Server;

//   sendProgressUpdate(progress: string) {
//     console.log("Emitting progressUpdate: " + progress);
//     this.server.emit('progressUpdate', progress);
//   }

//   sendPodStatusUpdate(status: { id: string | null; type: string; status: string }) {
//     console.log("Emitting podStatusUpdate: ", status);
//     this.server.emit('podStatusUpdate', status);
//   }

//   public async getInstanceStatus(): Promise<{ id: string; step: string }[]> {
//     const statuses: { id: string; step: string }[] = [];

//     // Get the status of the JMeter master
//     const masterPodName = await this.kubernetesService.getPodName(
//       'jmeter-master',
//       'perf-platform',
//     );
//     const masterPodStatus = await this.kubernetesService.getPodStatus(
//       masterPodName,
//       'perf-platform',
//     );
//     statuses.push({
//       id: masterPodName,
//       step: this.mapPodStatusToStep(masterPodStatus),
//     });

//     // Get the status of the JMeter slaves
//     const slavePods = await this.kubernetesService.getPodsByLabel(
//       'app=jmeter-slave',
//       'perf-platform',
//     );
//     for (const pod of slavePods) {
//       const podStatus = await this.kubernetesService.getPodStatus(
//         pod.metadata.name,
//         'perf-platform',
//       );
//       statuses.push({
//         id: pod.metadata.name,
//         step: this.mapPodStatusToStep(podStatus),
//       });
//     }

//     return statuses;
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
// }
