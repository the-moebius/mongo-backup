
import type { Transform, Readable, Writable } from 'node:stream';

import {
  CipherKey,
  createCipheriv,
  createDecipheriv,
  randomBytes,

} from 'node:crypto';


const algorithm = 'aes-256-ctr';


export function useEncryption(args: {
  key: CipherKey;
  outputStream: Writable;

}): Transform {

  const iv = randomBytes(16);

  const cipher = createCipheriv(
    algorithm,
    args.key,
    iv
  );

  // Writing IV to the beginning of the file,
  // so it could be decoded later.
  args.outputStream.write(iv);

  return cipher;

}

export async function useDecryption(args: {
  key: CipherKey;
  inputStream: Readable;

}): Promise<Transform> {

  const { key, inputStream } = args;

  return new Promise(resolve => {

    inputStream.on('readable', onReadable);


    function onReadable() {

      // Reading IV from the beginning of the file
      const iv = inputStream.read(16);

      // This will continue the stream
      inputStream.off('readable', onReadable);

      const decipher = createDecipheriv(algorithm, key, iv);

      resolve(decipher);

    }

  });

}
