
import './common/dotenv.js';

import {
  FsStorageProvider,
  MongoRestoreArgs,
  mongoRestore,

} from '@moebius/mongo-backup';

import { EnvVars } from './common/env-vars.js';


export async function main(): Promise<void> {

  const mongoUri = EnvVars.requireString('MONGO_URL_DEST');
  const aesKey = EnvVars.requireString('AES_KEY');

  const key = Buffer.from(aesKey, 'hex');

  const storageProvider = new FsStorageProvider({
    basePath: 'dumps',
  });

  const args: MongoRestoreArgs = {
    uri: mongoUri,
    storageProvider,
    path: '221124/221124-045601-mongodump.br.enc',
    decryption: {
      key,
    },
  };

  await mongoRestore(args);

}


try {
  await main();

} catch (error: any) {
  console.error(`Application failed with error`);
  console.error(error);

}
