
import './common/dotenv.js';

import {
  S3StorageProvider,
  mongoRestore,

} from '@moebius/mongo-backup';

import { EnvVars } from './common/env-vars.js';


export async function main(): Promise<void> {

  const mongoUri = EnvVars.requireString('MONGO_URL_DEST');
  const aesKey = EnvVars.requireString('AES_KEY');

  const key = Buffer.from(aesKey, 'hex');

  const storageProvider = new S3StorageProvider({
    s3Config: {
      endpoint: 'https://storage.yandexcloud.net/',
    },
    request: {
      Bucket: 'acme-mongo-backup',
    },
  });

  await mongoRestore({
    storageProvider,
    uri: mongoUri,
    path: '221124/221124-055138-mongodump.br',
    decryption: {
      key,
    },
  });

}


try {
  await main();

} catch (error: any) {
  console.error(`Application failed with error`);
  console.error(error);

}
