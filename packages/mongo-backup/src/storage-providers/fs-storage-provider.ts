
import { mkdir, unlink } from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { dirname, join as joinPaths } from 'node:path';

import { isFileExists } from '../common/fs.js';
import { usePromise } from '../common/use-promise.js';
import { StorageProvider as SP } from './storage-provider.js';


export class FsStorageProvider extends SP.StorageProvider {

  public async read(args: SP.ReadArgs): Promise<SP.ReadResult> {

    const { promise, resolve, reject } = usePromise();

    const stream = createReadStream(
      this.getFilePath(args.path)
    );

    stream.on('close', resolve);
    stream.on('error', reject);

    return {
      stream,
      promise,
    };

  }

  public async write(args: SP.WriteArgs): Promise<SP.WriteResult> {

    const filePath = this.getFilePath(args.path);

    if (!args.overwrite && await isFileExists(filePath)) {
      throw new Error(`File already exists: "${args.path}"`);
    }

    // Make sure directory exists
    await mkdir(dirname(filePath), {
      recursive: true,
    });

    const stream = createWriteStream(filePath);

    return { stream };

  }

  public async delete(args: SP.DeleteArgs): Promise<void> {

    await unlink(args.outputPath);

  }


  private getFilePath(path: string): string {

    return joinPaths(
      (this.options.basePath || process.cwd()),
      path
    );

  }

}
