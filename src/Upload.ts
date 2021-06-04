import AWS from 'aws-sdk';
import fs from 'fs-extra';
import { syncDirectoryWithS3 } from './Sync';
import { isUploadConfig, UploadConfig } from './Config';

/**
 * Upload to s3
 * @param configPath the path to config file
 * @param localDirPath the path to local directory to synchronize
 */
export const upload = async (configPath: string, localDirPath: string): Promise<void> => {
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file: ${configPath} does not exist.`);
  }

  const conf = (await import(configPath)) as UploadConfig;
  if (!isUploadConfig(conf)) {
    throw new Error(`Type of conf is not 'UploadConfig'.`);
  }
  const cred = new AWS.Credentials(conf.aws);
  const s3 = new AWS.S3({ credentials: cred });
  return syncDirectoryWithS3(s3, conf.sync, localDirPath);
};
