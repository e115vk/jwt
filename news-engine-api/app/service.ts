import { Express } from 'express';

require('tsconfig-paths/register');
require('dotenv').config();

import * as http from 'http';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import { NewsController } from '@app/entities';
import { Connection, getConnectionManager } from 'typeorm';
import typeORMConfig = require('@app/ormconfig');

export class NewsEngineAPI {
  public server: Express;
  public httpServer: http.Server;

  private connection?: http.Server;
  private postgreConnection?: Connection;
  private baseAPIPath: string = '/api';

  constructor() {
    this.server = express();
    this.httpServer = http.createServer(this.server);
  }

  public async start() {
    this.registerShutdownHooks();
    this.setupBodyParser();
    this.registerControllers();

    await this.connectToDatabase();
    const port = process.env.port ? parseInt(process.env.port) : 3030;
    await this.startServer(port);
  }

  public async stop() {
    if (this.connection) {
      return new Promise((resolve, reject) => {
        this.connection!.close((err?: Error) => {
          err ? reject(err) : resolve();
        });
      });
    }

    if (this.postgreConnection) {
      await this.postgreConnection.close();
      console.log('Connection to database closed');
    }

    return;
  }

  private startServer(port: number): Promise<void> {
    return new Promise(resolve => {
      this.connection = this.httpServer.listen(port, () => {
        console.log(`Express server connected on ${port}`);
        resolve();
      });
    });
  }

  private registerShutdownHooks() {
    let gracefulShutdown = () =>
      this.stop()
        .then(() => console.log('Stopping service'))
        .then(() => process.exit(), () => process.exit());

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  }

  private async connectToDatabase() {
    try {
      this.postgreConnection = getConnectionManager().create(typeORMConfig);

      await this.postgreConnection.connect();
      console.log('PostgreDB successfully connected');
    } catch (err) {
      console.error(err);
      setTimeout(this.connectToDatabase.bind(this), 3000);
    }
  }

  private setupBodyParser() {
    this.server.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }));
    this.server.use(bodyParser.json({ limit: '50mb' }));
    this.server.use(bodyParser.text({ limit: '50mb' }));
  }

  private registerControllers() {
    this.server.use(this.baseAPIPath, NewsController);
  }
}
