import { S3 } from 'aws-sdk';
import { SyncConfig } from './Config';
/**
 * Synchronize from a local directory to S3 bucket
 * @param s3 S3 instance
 * @param param1 object for bucket name and directory prefix, paths not to be synchronized
 * @param dirPath the path to local directory to synchronize
 * @returns promise that returns no value
 */
export declare const syncDirectoryWithS3: (s3: S3, { bucket, prefix, excludePaths }: SyncConfig, dirPath: string) => Promise<void>;
