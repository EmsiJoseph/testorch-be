
import { expressJwtSecret, GetVerificationKey } from 'jwks-rsa';
import { promisify } from 'util';
import { expressjwt } from 'express-jwt';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';

@Injectable()
export class SocketAuthorizationGuard implements CanActivate {
  private AUTH0_AUDIENCE: string;
  private AUTH0_DOMAIN: string;

  constructor(private configService: ConfigService) {
    this.AUTH0_DOMAIN = this.configService.get<string>('AUTH0_DOMAIN') || '';
    this.AUTH0_AUDIENCE = this.configService.get<string>('AUTH0_AUDIENCE') || '';
  }

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const client = context.switchToWs().getClient<Socket>();
    const token = client.handshake.headers.authorization;

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    const checkJwt = promisify(
      expressjwt({
        secret: expressJwtSecret({
          cache: true,
          rateLimit: true,
          jwksRequestsPerMinute: 5,
          jwksUri: `${this.AUTH0_DOMAIN}.well-known/jwks.json`,
        }) as GetVerificationKey,
        audience: this.AUTH0_AUDIENCE,
        issuer: this.AUTH0_DOMAIN,
        algorithms: ['RS256'],
      }),
    );

    try {
      const mockRequest = {
        headers: {
          authorization: token,
        },
        get: (header: string) => {
          return header === 'authorization' ? token : null;
        },
        header: (name: string) => {
          return name === 'authorization' ? token : null;
        },
        accepts: () => false,
        acceptsCharsets: () => false,
        acceptsEncodings: () => false,
        acceptsLanguages: () => false,
        range: () => null,
        param: () => null,
        is: () => false,
        protocol: 'http',
        secure: false,
        ip: '',
        ips: [],
        subdomains: [],
        path: '',
        hostname: '',
        host: '',
        fresh: false,
        stale: true,
        xhr: false,
        body: {},
        cookies: {},
        method: 'GET',
        params: {},
        query: {},
        route: {},
        signedCookies: {},
        originalUrl: '',
        url: '',
        baseUrl: '',
        app: {} as any,
        res: {} as any,
        next: () => {},
      } as any;

      const mockResponse = {} as any;

      await checkJwt(mockRequest, mockResponse);
      return true;
    } catch (error) {
      throw new UnauthorizedException(error);
    }
  }
}