import { Module, ValidationPipe } from '@nestjs/common';
import { InfrastructureModule } from './core/infrastructure/infrastructure.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PresentationModule } from './core/presentation/presentation.module';
import { ConfigModule } from '@nestjs/config';
import { RolesGuard } from './foundation/guards/roles.guard';
import { AuthorizationGuard } from './foundation/guards/authorization.guard';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import {
  AllExceptionsFilter,
  BadRequestExceptionFilter,
  ForbiddenExceptionFilter,
  NotFoundExceptionFilter,
  UnauthorizedExceptionFilter,
  ValidationExceptionFilter,
} from './foundation/filters';
import { ValidationError } from 'class-validator';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    InfrastructureModule,
    PresentationModule,
    HttpModule,
  ],
  providers: [AuthorizationGuard, RolesGuard, { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_FILTER, useClass: ValidationExceptionFilter },
    { provide: APP_FILTER, useClass: BadRequestExceptionFilter },
    { provide: APP_FILTER, useClass: UnauthorizedExceptionFilter },
    { provide: APP_FILTER, useClass: ForbiddenExceptionFilter },
    { provide: APP_FILTER, useClass: NotFoundExceptionFilter },
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          exceptionFactory: (errors: ValidationError[]) => {
            return errors[0];
          },
        }),
    }],

})
export class AppModule {
}
