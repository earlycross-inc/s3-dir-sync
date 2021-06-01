import AWS from 'aws-sdk';
import fs from 'fs-extra';
import { syncDirectoryWithS3 } from './Sync';
import { isUploadConfig, UploadConfig } from './Config';

/**
 * Upload to s3
 * @param configPath the path of config file
 * @param localDirPath the path of local directory to synchronize
 */
export const upload = async (configPath: string, localDirPath: string): Promise<void> => {
  if (!fs.existsSync(configPath)) {
    console.error(`Config file: ${configPath} does not exist.`);
    return;
  }

  const conf = (await import(configPath)) as UploadConfig;
  if (!isUploadConfig(conf)) {
    console.error(`Type of conf is not 'UploadConfig'.`);
    return;
  }
  const cred = new AWS.Credentials(conf.aws);
  const s3 = new AWS.S3({ credentials: cred });
  return syncDirectoryWithS3(s3, conf.sync, localDirPath);
};
