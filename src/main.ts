import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import * as helmet from 'helmet';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Apply the global exception filter

  // Enable security headers
  app.use(helmet.default());

  // Enable CORS for HTTP requests
  app.enableCors({
    origin: 'https://testorch.com:8443', // Replace with your frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    credentials: true, // Include credentials if needed
  });

  // Enable WebSockets with Socket.IO adapter
  app.useWebSocketAdapter(new IoAdapter(app));

  // Set global prefix for the API
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // WebSocket or any real-time communication setup if required
  const port = process.env.PORT || 5000;

  const server = await app.listen(port);

  Logger.log(
    `🚀 Testorch-Backend is running on: http://localhost:${port}/${globalPrefix}`,
  );
  Logger.log(
    `🚀 WebSocket server is running on: ws://localhost:${port}`,
  );

  const gracefulShutdown = () => {
    console.log('Shutting down gracefully...');
    server.close(() => {
      console.log('Closed out remaining connections');
      process.exit(0);
    });

    setTimeout(() => {
      console.error(
        'Could not close connections in time, forcefully shutting down',
      );
      process.exit(1);
    }, 10000); // Wait for 10 seconds before forcefully shutting down
  };

  // Listen for termination signals (e.g., Ctrl + C)
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Log and handle the error accordingly
  });

  // Ensure ports are released on exit
  process.on('exit', (code) => {
    console.log(`Process exited with code: ${code}`);
    server.close(() => {
      console.log('Server closed');
    });
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Log and handle the error accordingly
  });

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}

bootstrap();
