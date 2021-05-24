import path from 'path';
import yargs from 'yargs';
import AppRootPath from 'app-root-path';
import { upload } from './Upload';

export const cli = async (): Promise<void> => {
  const argv = await yargs
    .options({
      config: {
        alias: 'c',
        type: 'string',
        description: 'path of the config file to upload',
        demandOption: true
      },
      dir: {
        alias: 'd',
        type: 'string',
        description: 'path of the directory to synchronize',
        demandOption: true
      }
    })
    .help().argv;

  const configFullPath = path.join(AppRootPath.path, argv.config);
  const dirFullPath = path.join(AppRootPath.path, argv.dir);
  await upload(configFullPath, dirFullPath);
};
