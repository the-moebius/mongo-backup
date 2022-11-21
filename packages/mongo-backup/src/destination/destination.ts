
import type { Values } from '../types/values.js';


export namespace Destination {
  export const FileSystem = 'file-system';
  export const S3 = 's3';
}

export type DestinationType = Values<typeof Destination>;

export interface DestinationSpecBase {
  type: DestinationType;
  path: string;
}

export interface DestinationSpecFileSystem extends DestinationSpecBase {
  type: (typeof Destination)['FileSystem'];
}

export interface DestinationSpecS3 extends DestinationSpecBase {
  type: (typeof Destination)['S3'];
}

export type DestinationSpec = (
  | DestinationSpecFileSystem
  | DestinationSpecS3
);
