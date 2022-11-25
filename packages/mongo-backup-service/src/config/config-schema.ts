
import { Static, Type } from '@sinclair/typebox';


const ClusterSchema = Type.Object({

  name: Type.String(),

  uri: Type.String(),

});

const StorageSchemaS3 = Type.Object({

  name: Type.String(),

  type: Type.Literal('s3'),

  options: Type.Object({

    bucket: Type.String(),

    endpoint: Type.Optional(
      Type.String()
    ),

    accessKeyId: Type.Optional(
      Type.String()
    ),

    secretAccessKey: Type.Optional(
      Type.String()
    ),

  }),

});

const StorageSchema = Type.Union([
  StorageSchemaS3,
]);

const JobSchema = Type.Object({

  name: Type.String(),

  schedule: Type.String(),

  cluster: Type.String(),

  storages: Type.Array(Type.String()),

  db: Type.Optional(Type.String()),

  excludeCollections: Type.Optional(
    Type.Array(Type.String())
  ),

  encryptionKey: Type.Optional(
    Type.String()
  ),

});

export const ConfigSchema = Type.Object({

  clusters: Type.Array(ClusterSchema),

  storages: Type.Array(StorageSchema),

  jobs: Type.Array(JobSchema),

});

export type Cluster = Static<typeof ClusterSchema>;
export type Storage = Static<typeof StorageSchema>;
export type Job = Static<typeof JobSchema>;
export type Config = Static<typeof ConfigSchema>;
