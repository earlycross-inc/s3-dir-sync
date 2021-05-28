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
  cloudFrontId?: string;
}

export const isUploadConfig = (arg: any): arg is UploadConfig =>
  arg !== null &&
  typeof arg === 'object' &&
  typeof arg.aws.accessKeyId === 'string' &&
  typeof arg.aws.secretAccessKey === 'string' &&
  typeof arg.sync.bucket === 'string' &&
  (typeof arg.sync.prefix === 'string' || typeof arg.prefix === 'undefined') &&
  (Array.isArray(arg.excludePaths) || typeof arg.excludePaths === 'undefined') &&
  (typeof arg.sync.cloudFrontId === 'string' || typeof arg.cloudFrontId === 'undefined');
