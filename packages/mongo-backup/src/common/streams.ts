
import { pipeline as nodePipeline } from 'node:stream';
import { promisify } from 'node:util';


export const pipeline = promisify(nodePipeline);
