export interface UploadConfig {
  aws: AWSConfig;
  sync: SyncConfig;
}

export interface AWSConfig {
  accessKeyId: string;
  secretAccessKey: string;
}

export interface SyncConfig {
  bucket: string;
  prefix?: string;
  excludePaths?: string[]; // paths to be excluded, in glob pattern
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
