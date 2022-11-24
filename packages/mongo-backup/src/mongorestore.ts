
import type { Transform } from 'node:stream';
import type { Writable } from 'node:stream';
import type { ParsedPath } from 'node:path';
import { parse as parsePath } from 'node:path';

import { execa } from 'execa';
import { createBrotliDecompress } from 'zlib';

import type { EncryptionOptions } from './mongodump.js';
import type { StorageProvider as SP } from './storage-providers/storage-provider.js';
import { useDecryption } from './common/encryption.js';
import { pipeline } from './common/streams.js';


export interface MongoRestoreArgs {
  storageProvider: SP.StorageProvider;
  uri: string;
  path: string;
  oplog?: boolean;
  gzip?: boolean;
  brotli?: boolean;
  decrypt?: boolean;
  decryption?: EncryptionOptions;
  stdout?: (Writable | false);
  stderr?: (Writable | false);
}


export async function mongoRestore(
  // @ts-ignore
  args: MongoRestoreArgs

): Promise<void> {

  // A list of pending promises to await
  const promises: Promise<any>[] = [];

  const extensions = parseExtensions(args.path);

  const useGzip = (args.gzip ?? extensions.includes('.gz'));
  const useBrotli = (args.brotli ?? extensions.includes('.br'));
  const shouldDecrypt = (args.decrypt ?? extensions.includes('.enc'));

  if (useGzip && useBrotli) {
    throw new Error(
      `Can't use Gzip and Brotli at the same time, ` +
      `check program arguments or the dump filename extension`
    );
  }

  const transformers: Transform[] = [];

  const reader = await args.storageProvider.read({
    path: args.path,
  });

  if (reader.promise) {
    promises.push(reader.promise);
  }

  if (shouldDecrypt) {

    if (!args.decryption?.key) {
      throw new Error(
        `Decryption key must be specified ` +
        `in order to restore encrypted dump`
      );
    }

    transformers.push(
      await useDecryption({
        key: args.decryption?.key,
        inputStream: reader.stream,
      })
    );

  }

  if (useBrotli) {
    transformers.push(createBrotliDecompress());
  }

  const subProcess = execa(
    'mongorestore',
    getMongoRestoreArgs()
  );

  promises.push(subProcess);

  const { stdin, stdout, stderr } = subProcess;

  if (args.stdout !== false) {
    stdout?.pipe(args.stdout || process.stdout);
  }

  if (args.stderr !== false) {
    stderr?.pipe(args.stderr || process.stderr);
  }

  promises.push(
    pipeline([
      reader.stream,
      ...transformers,
      stdin!
    ])
  );

  // Waiting for all operations to complete
  await Promise.all(promises);


  function parseExtensions(path: string): string[] {

    const exts: string[] = [];

    let parsed: (ParsedPath | undefined);

    do {
      parsed = parsePath(parsed?.name || path);
      if (parsed.ext) {
        exts.push(parsed.ext);
      }

    } while (parsed.ext);

    return exts;

  }

  function getMongoRestoreArgs(): string[] {

    const commandArgs: string[] = [
      `--uri="${args.uri}"`,
      '--archive',
    ];

    if (args.oplog) {
      commandArgs.push('--oplogReplay');
    }

    if (useGzip) {
      commandArgs.push('--gzip');
    }

    return commandArgs;

  }

}
