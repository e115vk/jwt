import { ConnectionOptions } from 'typeorm';
import 'tsconfig-paths/register';
import { Commentary, News, User } from '@app/entities';

const entities = [News, Commentary, User];

const typeORMConfig: ConnectionOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  database: process.env.DB_NAME || 'news-engine',
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  synchronize: true,
  logging: true,
  entities,
  migrationsTableName: 'migration_table',
  migrationsRun: true,
  migrations: ['app/migrations/*.ts'],
  cli: {
    migrationsDir: 'app/migrations'
  }
};

export = typeORMConfig;
