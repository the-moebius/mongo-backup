
import { mkdir } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { dirname } from 'node:path';

import { isFileExists } from '../common/fs.js';
import { Writer, WriterArgs, WriterResult } from './writer.js';


export class FSWriter extends Writer {

  public async use(args: WriterArgs): Promise<WriterResult> {

    if (!args.overwrite && await isFileExists(args.outputPath)) {
      throw new Error(`File already exists: "${args.outputPath}"`);
    }

    // Make sure directory exists
    await mkdir(dirname(args.outputPath), {
      recursive: true,
    });

    const stream = createWriteStream(args.outputPath);

    return { stream };

  }

}
