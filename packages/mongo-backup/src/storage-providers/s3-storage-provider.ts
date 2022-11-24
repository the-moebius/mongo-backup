
import assert from 'assert/strict';
import { PassThrough, Readable } from 'node:stream';
import { join as joinPaths } from 'node:path/posix';

import type { PutObjectCommandInput, S3ClientConfig } from '@aws-sdk/client-s3';
import { GetObjectCommand, HeadObjectCommand, NotFound, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

import { StorageProvider as SP } from './storage-provider.js';


export interface S3StorageProviderOptions extends SP.Options {
  request: PartialRequest;
  s3Config?: S3ClientConfig;
  s3Client?: S3Client;
}

export type PartialRequest = Omit<PutObjectCommandInput, (
  | 'Bucket'
  | 'Body'
  | 'Key'
)> & {
  Bucket: string;
};


export class S3StorageProvider
  extends SP.StorageProvider<S3StorageProviderOptions>
{

  readonly #client: S3Client;

  readonly #request: PartialRequest;


  constructor(options: S3StorageProviderOptions) {

    super(options);

    this.#client = (options?.s3Client || new S3Client(
      (options?.s3Config || {})
    ));

    this.#request = options.request;

  }


  public async read(args: SP.ReadArgs): Promise<SP.ReadResult> {

    const bucket = this.#request.Bucket;
    const key = this.getObjectKey(args.path);

    try {

      const data = await this.#client.send(
        new GetObjectCommand({
          ...this.#request,
          Key: key,
        })
      );

      if (!data.Body) {
        throw new Error(`Failed to read object body`);
      }

      assert(data.Body instanceof Readable);

      return {
        stream: data.Body,
      };

    } catch (error: any) {

      if (error.name === 'NoSuchKey') {
        throw new Error(
          `S3 object is not found "${bucket}:${key}"`
        );
      }

      throw error;

    }

  }

  public async write(args: SP.WriteArgs): Promise<SP.WriteResult> {

    const bucket = this.#request.Bucket;
    const key = this.getObjectKey(args.path);

    if (!args.overwrite) {

      const objectExists = await this.isObjectExists({
        bucket,
        key,
      });

      if (objectExists) {
        throw new Error(
          `S3 object already exists "${bucket}:${key}", ` +
          `use the "overwrite" option if you would like ` +
          `to overwrite it`
        );
      }

    }

    const stream = new PassThrough();

    const promise = this.#client.send(
      new PutObjectCommand({
        ...this.#request,
        Key: key,
        Body: stream,
      })
    );

    return {
      stream,
      promise,
    };

  }

  public async delete(args: SP.DeleteArgs): Promise<void> {
    args.outputPath;
    // @todo
  }


  private getObjectKey(path: string): string {

    return joinPaths(
      (this.options.basePath || ''),
      path
    );

  }

  private async isObjectExists(args: {
    bucket: string;
    key: string;

  }): Promise<boolean> {

    try {
      await this.#client.send(
        new HeadObjectCommand({
          Bucket: args.bucket,
          Key: args.key,
        })
      );

      return true;

    } catch (error: any) {

      if (error instanceof NotFound) {
        return false;
      }

      throw error;

    }

  }

}
