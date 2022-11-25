
import { readFile } from 'node:fs/promises';

import { Value } from '@sinclair/typebox/value';

import type { Config } from './config-schema.js';
import { ConfigSchema } from './config-schema.js';


export async function loadConfig(
  path: string

): Promise<Config> {

  const content = await readFile(path, 'utf-8');

  const data = JSON.parse(content) as Config;

  const errors = Array.from(
    Value.Errors(ConfigSchema, data)
  );

  if (errors.length > 0) {
    let lines = ['Failed to load config'];
    for (const error of errors) {
      lines.push(JSON.stringify({
        path: error.path,
        message: error.message,
      }, null, 2));
    }
    throw new Error(lines.join('\n'));
  }

  return data;

}
