
import type { Writable, Readable } from 'node:stream';


export namespace StorageProvider {

  export interface Options {
    basePath?: string;
  }

  export interface WriteArgs {
    path: string;
    overwrite?: (boolean | undefined);
  }

  export interface WriteResult {
    stream: Writable;
    promise?: Promise<unknown>;
  }

  export interface ReadArgs {
    path: string;
  }

  export interface ReadResult {
    stream: Readable;
    promise?: Promise<unknown>;
  }

  export interface DeleteArgs {
    outputPath: string;
  }


  export abstract class StorageProvider<
    OptionsType extends Options = Options
  > {

    public constructor(
      protected readonly options: OptionsType = {} as OptionsType
    ) {
    }

    abstract read(args: ReadArgs): Promise<ReadResult>;

    abstract write(args: WriteArgs): Promise<WriteResult>;

    abstract delete(args: DeleteArgs): Promise<void>;

  }

}
