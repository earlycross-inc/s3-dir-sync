export interface UploadConfig {
  /**
   * aws config object
   */
  aws: AWSConfig;

  /**
   * sync config object
   */
  sync: SyncConfig;
}

export interface AWSConfig {
  /**
   * access key id of your aws account
   */
  accessKeyId: string;

  /**
   * secret access key id of your aws account
   */
  secretAccessKey: string;
}

export interface SyncConfig {
  /**
   * S3 bucket name
   */
  bucket: string;

  /**
   * directory prefix
   */
  prefix?: string;

  /**
   * paths to be excluded, in glob pattern
   */
  excludePaths?: string[];
}

export const isUploadConfig = (arg: unknown): arg is UploadConfig => {
  const uploadConfigArg = arg as UploadConfig;
  return (
    uploadConfigArg &&
    uploadConfigArg.aws &&
    uploadConfigArg.sync &&
    typeof uploadConfigArg.aws.accessKeyId === 'string' &&
    typeof uploadConfigArg.aws.secretAccessKey === 'string' &&
    typeof uploadConfigArg.sync.bucket === 'string' &&
    (typeof uploadConfigArg.sync.prefix === 'string' || typeof uploadConfigArg.sync.prefix === 'undefined') &&
    (Array.isArray(uploadConfigArg.sync.excludePaths) || typeof uploadConfigArg.sync.excludePaths === 'undefined')
  );
};
