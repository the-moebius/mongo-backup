
import type { CipherKey } from 'node:crypto';
import type { Transform } from 'node:stream';
import type { Writable } from 'node:stream';
import { join } from 'node:path';

import { execa } from 'execa';

import type { Writer } from './writers/writer.js';
import { useEncryption } from './common/encryption.js';
import { logger } from './common/logger.js';
import { pipeline } from './common/streams.js';


export interface CreateMongoDumpArgs {
  url: string;
  writer: Writer;
  db?: string;
  output?: OutputOptions;
  gzip?: boolean;
  encryption?: EncryptionOptions;
  logStream?: (Writable | false);
}

export interface OutputOptions {
  basePath?: string;
  outputName?: string;
  overwrite?: boolean;
}

export interface EncryptionOptions {
  key: CipherKey;
}


export async function createMongoDump(
  args: CreateMongoDumpArgs

): Promise<void> {

  if (args.db) {
    logger.info(`Creating dump of the ${args.db} database`);

  } else {
    logger.info(`Creating database cluster dump`);

  }

  // A list of pending promises to await
  const promises: Promise<any>[] = [];

  const writer = await args.writer.use({
    outputPath: join(
      (args.output?.basePath || process.cwd()),
      getOutputName()
    ),
    overwrite: args.output?.overwrite,
  });

  if (writer.promise) {
    promises.push(writer.promise);
  }

  const transformers: Transform[] = [];

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

  if (args.db) {
    logger.info(`Finished dumping ${args.db} database`);

  } else {
    logger.info(`Database cluster dump complete`);

  }


  function getOutputName(): string {

    if (args.output?.outputName) {
      return args.output.outputName;
    }

    let outputName = 'mongodump';

    if (args.gzip) {
      outputName += '.gz';
    }

    if (args.encryption) {
      outputName += '.enc';
    }

    return outputName;

  }

  function getMongodumpArgs(): string[] {

    const mongodumpArgs: string[] = [
      `--uri="${args.url}"`,
      `--archive`,
    ];

    if (args.gzip) {
      mongodumpArgs.push(`--gzip`);
    }

    if (args.db) {
      mongodumpArgs.push(
        `--db="${args.db}"`,
      );
    }

    return mongodumpArgs;

  }

}
