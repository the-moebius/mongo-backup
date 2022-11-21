
import './common/dotenv';
import { createDecipheriv } from 'crypto';

import { createReadStream, createWriteStream } from 'fs';

import { EnvVars } from './common/env-vars.js';
import { logger } from './common/logger.js';


export async function decode(): Promise<void> {

  const aesKey = EnvVars.requireString('AES_KEY');

  logger.info('Starting to decode a file');

  const key = Buffer.from(aesKey, 'hex');

  const readStream = createReadStream('dump.gz.enc');
  const writeStream = createWriteStream('dump.gz');

  readStream.on('readable', onReadable);

  writeStream.on('close', () => {
    logger.info('Finished decoding file');
  });


  function onReadable() {
    const iv = readStream.read(16);
    const algorithm = 'aes-256-cbc';
    const decipher = createDecipheriv(algorithm, key, iv);
    readStream.pipe(decipher);
    decipher.pipe(writeStream);
    readStream.off('readable', onReadable);
  }

}


try {
  await decode();

} catch (error: any) {
  logger.error(`Application failed with error`);
  logger.error(error);

}
