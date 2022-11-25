#!/usr/bin/env node

import {
  join as joinPaths,
  resolve as resolvePath,

} from 'node:path';

import { runService } from './service-runner.js';


const configPath = (process.argv[2]
  ? resolvePath(process.argv[2])
  : joinPaths(process.cwd(), 'config.json')
);

await runService({
  configPath,
});
