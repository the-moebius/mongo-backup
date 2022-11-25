
import {
  CreateMongoDumpArgs,
  S3StorageProvider,
  S3StorageProviderOptions,
  StorageProvider as SP,
  createMongoDump,

}  from '@moebius/mongo-backup';

import { scheduleJob } from 'node-schedule';

import { EnvVars } from './common/env-vars.js';
import { logger } from './common/logger.js';
import type { Config, Job, Storage } from './config/config-schema.js';
import { loadConfig } from './config/load-config.js';


export interface RunServiceOptions {
  configPath: string;
}


export async function runService(options: RunServiceOptions) {

  const config = await loadConfig(options.configPath);

  scheduleJobs(config);

}


function scheduleJobs(config: Config) {

  for (const job of config.jobs) {

    logger.info(
      `Scheduling job: "${job.name}" at "${job.schedule}"`
    );

    scheduleJob(job.schedule, () => runJob({
      config,
      job,
    }));

  }

}

async function runJob(args: {
  config: Config;
  job: Job;

}): Promise<void> {

  const { config, job } = args;

  logger.info(`Running job: "${job.name}"`);

  if (job.storages.length <= 0) {
    throw new Error(
      `At least one storage must be configured ` +
      `for job: ${job.name}`
    );
  }

  if (job.storages.length > 1) {
    throw new Error(
      `Only one storage is currently supported ` +
      `(job: ${job.name})`
    );
  }

  const storageName = job.storages[0];

  const storage = (config.storages
    .find($storage => $storage.name === storageName)
  );

  if (!storage) {
    throw new Error(
      `Storage is not found by name: ${storageName}`
    );
  }

  const storageProvider = createStorageProvider({
    job,
    storage,
  });

  const cluster = (config.clusters
    .find($cluster => $cluster.name === job.cluster)
  );

  if (!cluster) {
    throw new Error(
      `Cluster is not found by name: ${job.cluster}`
    );
  }

  const uri = EnvVars.resolveValue(cluster.uri);

  const options: CreateMongoDumpArgs = {
    storageProvider,
    uri,
    brotli: true,
  };

  if (job.db) {
    options.db = job.db;
  }

  if (job.encryptionKey) {
    const keyHex = EnvVars.resolveValue(job.encryptionKey);
    options.encryption = {
      key: Buffer.from(keyHex, 'hex'),
    };
  }

  if (job.excludeCollections) {
    options.excludeCollections = job.excludeCollections;
  }

  logger.info(`Starting to create a MongoDB dump`);

  await createMongoDump(options);

  logger.info(`Finished creating a dump`);

}

function createStorageProvider(args: {
  job: Job;
  storage: Storage;

}): SP.StorageProvider {

  const { job, storage } = args;

  switch (storage.type) {

    case 's3': {

      const options: S3StorageProviderOptions = {
        basePath: job.name,
        request: {
          Bucket: storage.options.bucket,
        },
      };

      if (!options.s3Config) {
        options.s3Config = {};
      }

      if (storage.options.endpoint) {
        options.s3Config.endpoint = storage.options.endpoint;
      }

      if (
        storage.options.accessKeyId &&
        storage.options.secretAccessKey
      ) {
        options.s3Config.credentials = {
          accessKeyId: EnvVars.resolveValue(
            storage.options.accessKeyId
          ),
          secretAccessKey: EnvVars.resolveValue(
            storage.options.secretAccessKey
          ),
        };
      }

      return new S3StorageProvider(options);

    }

    default: {
      throw new Error(
        `Unknown storage type: ${storage.type}`
      );
    }

  }

}
