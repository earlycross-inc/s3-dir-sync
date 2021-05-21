import path from 'path';
import argv from 'argv';
import aws from 'aws-sdk';
import fs from 'fs-extra';
import { walk } from './Walk';

argv.option({
  name: 'config',
  short: 'c',
  type: 'string'
});

const args = argv.run();

/**
 * Upload to s3
 */
const upload = (): void => {
  // Load credentials from json.
  aws.config.loadFromPath(args.options.config);

  // Recursive call to upload function for files above dist.
  const s3 = new aws.S3();
  walk('', fileFuncClosure(s3), () => {}, []);
};

const fileFuncClosure =
  (s3: aws.S3): ((name: string, filePath: string, src: string) => void) =>
  async (name: string, filePath: string, __: string) => {
    const buf = fs.readFileSync(filePath);

    // If it is used application/octet-stream, it will just be downloaded even if it is accessed, so It needs to be specified HTML.
    const contentType = name.includes('.html') ? 'text/html' : undefined;

    const params: aws.S3.PutObjectRequest = {
      Bucket: '', // bucket name
      Key: path.relative('', filePath).replace(/\\/g, '/'), // file name (path including directory)
      Body: buf, // file content
      ContentType: contentType // Content-Type
    };
    s3.putObject(params, (err, data) => {
      if (err) console.log(err, err.stack);
      else console.log(data);
    });
  };

console.log(upload);
console.log(args.options.config);
