
import type { Writable } from 'node:stream';


export interface WriterArgs {
  outputPath: string;
  overwrite?: (boolean | undefined);
}

export interface WriterResult {
  stream: Writable;
  promise?: Promise<unknown>;
}


export abstract class Writer {

  abstract use(args: WriterArgs): Promise<WriterResult>;

}
