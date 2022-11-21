
import './common/dotenv.js';

import { EnvVars } from './common/env-vars.js';
import { logger } from './common/logger.js';
import { createMongoDump, CreateMongoDumpArgs } from './common/mongodump.js';
import { FSWriter } from './writers/fs-writer.js';
import { S3Writer } from './writers/s3-writer.js';


export async function main(): Promise<void> {

  const mongoUrl = EnvVars.requireString('MONGO_URL');
  const aesKey = EnvVars.requireString('AES_KEY');
  const databases = EnvVars.readStringList('DATABASES');

  const key = Buffer.from(aesKey, 'hex');

  if (databases && databases?.length <= 0) {
    throw new Error(`List of databases is empty`);
  }

  const s3Writer = new S3Writer({
    s3Config: {
      endpoint: 'https://storage.yandexcloud.net/',
    },
    request: {
      Bucket: 'acme-mongo-backup',
    },
  });

  const fsWriter = new FSWriter();

  const args: CreateMongoDumpArgs = {
    url: mongoUrl,
    writer: s3Writer,
    // writer: fsWriter,
    output: {
      basePath: 'dumps/foo',
      outputName: 'hello.dump',
      overwrite: true,
    },
    encryption: {
      key,
    },
    gzip: true,
  };

  if (databases) {

    logger.info(
      `Starting to dump the configured databases: ` +
      `${databases.join(', ')}`
    );

    for (const db of databases) {
      await createMongoDump({
        ...args,
        db,
      });

    }

  } else {
    await createMongoDump(args);

  }

}


try {
  await main();

} catch (error: any) {
  logger.error(`Application failed with error`);
  logger.error(error);

}
