import AWS from 'aws-sdk';
import fs from 'fs-extra';
import { syncDirectoryWithS3 } from './Sync';
import { isUploadConfig } from './UploadConfig';

/**
 * Upload to s3
 * @param config config file path
 * @param localDir local directory to synchronize
 */
export const upload = async (configPath: string, localDir: string): Promise<void> => {
  if (!fs.existsSync(configPath)) {
    console.error(`Config file: ${configPath} does not exist.`);
    return;
  }

  const conf = require(configPath);
  if (!isUploadConfig(conf)) {
    console.error(`conf of type is not assignable to parameter of type 'UploadConfig'.`);
    return;
  }

  const cred = new AWS.Credentials({ accessKeyId: conf.accessKeyId, secretAccessKey: conf.secretAccessKey });
  const s3 = new AWS.S3({ credentials: cred });

  return syncDirectoryWithS3(s3, conf, localDir);
};
