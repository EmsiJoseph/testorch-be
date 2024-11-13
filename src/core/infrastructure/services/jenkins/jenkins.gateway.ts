import { Injectable } from '@nestjs/common';
import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { startTestPlanV3UseCase } from 'src/core/application/use-cases/start-test-plan-v3.use-case';
import { StartTestV2Dto } from 'src/core/presentation/dto/test-plan.dto';
import { TeamRepository } from '../../repositories/team/team.repository';
import { TestPlanRepositoryV2 } from '../../repositories/test-plan/test-plan.repository-v2';
import { UsersRepository } from '../../repositories/users/users.repository';
import { GatewayService } from '../gateway/gateway.service';
import { GitHubService } from '../github/github.service';
import { KubernetesV2Service } from '../kubernetes/kubernetes-v2.service';
import { JenkinsService } from './jenkins.service';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: 'https://testorch.com:8443', // Replace with your frontend URL
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true, // Include credentials if needed
  },
})
export class JenkinsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly testPlanRepo: TestPlanRepositoryV2,
    private readonly userRepo: UsersRepository,
    private readonly githubService: GitHubService,
    private readonly teamRepo: TeamRepository,
    private readonly jenkinsService: JenkinsService,
    private readonly gatewayService: GatewayService,
    private readonly kubernetesV2Service: KubernetesV2Service,
  ) {}

  @SubscribeMessage('startTestV3')
  async handleStartTestV3(
    @MessageBody() startTestDto: StartTestV2Dto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    try {
      const result = await startTestPlanV3UseCase(
        startTestDto,
        this.testPlanRepo,
        this.githubService,
        this.jenkinsService,
        this.userRepo,
        this.teamRepo,
        this.gatewayService,
        this.kubernetesV2Service,
      );
      client.emit('testCompleted', result);
    } catch (error) {
      client.emit('testError', { message: error.message });
    }
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }
}
