
import { PassThrough } from 'node:stream';

import type { PutObjectCommandInput, S3ClientConfig } from '@aws-sdk/client-s3';
import { HeadObjectCommand, NotFound, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

import { Writer, WriterArgs, WriterResult } from './writer.js';


export interface S3WriterOptions {
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


export class S3Writer extends Writer {

  readonly #client: S3Client;

  readonly #request: PartialRequest;


  constructor(options: S3WriterOptions) {

    super();

    this.#client = (options?.s3Client || new S3Client(
      (options?.s3Config || {})
    ));

    this.#request = options.request;

  }


  public async use(args: WriterArgs): Promise<WriterResult> {

    const bucket = this.#request.Bucket;

    if (!args.overwrite) {

      const objectExists = await this.isObjectExists({
        bucket,
        key: args.outputPath,
      });

      if (objectExists) {
        throw new Error(
          `S3 object already exists "${bucket}:${args.outputPath}"`
        );
      }

    }

    const stream = new PassThrough();

    const promise = this.#client.send(
      new PutObjectCommand({
        ...this.#request,
        Key: args.outputPath,
        Body: stream,
      })
    );

    return {
      promise,
      stream,
    };

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
