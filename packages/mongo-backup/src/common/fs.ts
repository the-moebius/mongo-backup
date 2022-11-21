
import { stat } from 'node:fs/promises';


export async function isFileExists(
  path: string

): Promise<boolean> {

  try {

    await stat(path);

    return true;

  } catch (error: any) {

    if (error.code === 'ENOENT') {
      return false;
    }

    throw error;

  }

}
