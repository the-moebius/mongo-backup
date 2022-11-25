
import { stdout } from 'node:process';

import { ConfigSchema } from '../config/config-schema.js';


stdout.write(
  JSON.stringify(ConfigSchema, null, 2)
);
