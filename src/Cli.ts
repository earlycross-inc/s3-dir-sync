import yargs from 'yargs';
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

  await upload(argv.config, argv.dir);
};
