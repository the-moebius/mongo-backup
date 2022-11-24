
import type { CipherKey } from 'node:crypto';
import type { Transform } from 'node:stream';
import type { Writable } from 'node:stream';

import { execa } from 'execa';
import { DateTime } from 'luxon';
import { createBrotliCompress } from 'zlib';

import type { StorageProvider as SP } from './storage-providers/storage-provider.js';
import { useEncryption } from './common/encryption.js';
import { pipeline } from './common/streams.js';


export interface CreateMongoDumpArgs {
  storageProvider: SP.StorageProvider;
  uri: string;
  db?: string;
  output?: OutputOptions;
  oplog?: boolean;
  gzip?: boolean;
  brotli?: boolean;
  encryption?: EncryptionOptions;
  excludeCollections?: string[];
  logStream?: (Writable | false);
}

export interface OutputOptions {
  path?: string;
  overwrite?: boolean;
}

export interface EncryptionOptions {
  key: CipherKey;
}


export async function createMongoDump(
  args: CreateMongoDumpArgs

): Promise<void> {

  if (args.db && args.oplog) {
    throw new Error(
      `The "oplog" option can only be used for a full dump, ` +
      `do not specify the "db" option if you want that`
    );
  }

  if (args.gzip && args.brotli) {
    throw new Error(
      `"gzip" and "brotli" options can't be used at the same time`
    );
  }

  // A list of pending promises to await
  const promises: Promise<any>[] = [];

  const writer = await args.storageProvider.write({
    path: getOutputPath(),
    overwrite: args.output?.overwrite,
  });

  if (writer.promise) {
    promises.push(writer.promise);
  }

  const transformers: Transform[] = [];

  if (args.brotli) {
    transformers.push(createBrotliCompress());
  }

  if (args.encryption) {
    transformers.push(
      useEncryption({
        key: args.encryption.key,
        outputStream: writer.stream,
      })
    );
  }

  const subProcess = execa(
    'mongodump',
    getMongodumpArgs()
  );

  promises.push(subProcess);

  const { stdout, stderr } = subProcess;

  promises.push(
    // Arranging all the streams into a pipeline
    pipeline([
      stdout!,
      ...transformers,
      writer.stream,
    ])
  );

  // Redirecting error log
  if (args.logStream !== false) {
    stderr?.pipe(args.logStream || process.stdout);
  }

  // Waiting for all operations to complete
  await Promise.all(promises);


  function getOutputPath(): string {

    if (args.output?.path) {
      return args.output.path;
    }

    const date = DateTime.now().toUTC();

    const dateStr = date.toFormat('yyMMdd');
    const timeStr = date.toFormat('HHmmss');

    let outputName = (
      `${dateStr}/${dateStr}-${timeStr}-mongodump`
    );

    if (args.gzip) {
      outputName += '.gz';
    }

    if (args.brotli) {
      outputName += '.br';
    }

    if (args.encryption) {
      outputName += '.enc';
    }

    return outputName;

  }

  function getMongodumpArgs(): string[] {

    const mongodumpArgs: string[] = [
      `--uri="${args.uri}"`,
      `--archive`,
    ];

    if (args.db) {
      mongodumpArgs.push(
        `--db="${args.db}"`,
      );
    }

    if (args.oplog) {
      mongodumpArgs.push(`--oplog`);
    }

    if (args.gzip) {
      mongodumpArgs.push(`--gzip`);
    }

    if (args.excludeCollections) {
      for (const name of args.excludeCollections) {
        mongodumpArgs.push(`--excludeCollection="${name}"`)
      }
    }

    return mongodumpArgs;

  }

}
