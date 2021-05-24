import argv from 'argv';
import { upload } from './Upload';

export const cli = (): void => {
  argv.option({
    name: 'config',
    short: 'c',
    type: 'string'
  });
  argv.option({
    name: 'dir',
    short: 'd',
    type: 'string'
  });
  const args = argv.run();

  upload(args.options.config, args.options.dir).catch(e => console.error(e));
};
