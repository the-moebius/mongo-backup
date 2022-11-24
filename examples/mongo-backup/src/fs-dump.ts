
import './common/dotenv.js';

import { FsStorageProvider, createMongoDump } from '@moebius/mongo-backup';

import { EnvVars } from './common/env-vars.js';


export async function main(): Promise<void> {

  const mongoUrl = EnvVars.requireString('MONGO_URL_SRC');
  const aesKey = EnvVars.requireString('AES_KEY');

  const key = Buffer.from(aesKey, 'hex');

  const storageProvider = new FsStorageProvider({
    basePath: 'dumps',
  });

  await createMongoDump({
    storageProvider,
    uri: mongoUrl,
    db: 'test',
    brotli: true,
    encryption: {
      key,
    },
    excludeCollections: [
      'cache',
      'locks',
    ],
  });

}


try {
  await main();

} catch (error: any) {
  console.error(`Application failed with error`);
  console.error(error);

}
