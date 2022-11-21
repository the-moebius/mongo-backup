
import type { Transform, Writable } from 'node:stream';
import { CipherKey, createCipheriv, randomBytes } from 'node:crypto';


export function useEncryption(args: {
  key: CipherKey;
  outputStream: Writable;

}): Transform {

  const iv = randomBytes(16);

  const cipher = createCipheriv(
    'aes-256-gcm',
    args.key,
    iv
  );

  // Writing IV to the beginning of the file,
  // so it could be decoded later.
  args.outputStream.write(iv);

  return cipher;

}
