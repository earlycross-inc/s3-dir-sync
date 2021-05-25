export interface UploadConfig {
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  prefix: string;
  cloudFrontId?: string;
}

export const isUploadConfig = (arg: any): arg is UploadConfig =>
  arg !== null &&
  typeof arg === 'object' &&
  typeof arg.accessKeyId === 'string' &&
  typeof arg.secretAccessKey === 'string' &&
  typeof arg.bucket === 'string' &&
  typeof arg.prefix === 'string' &&
  (typeof arg.cloudFrontId === 'string' || typeof arg.cloudFrontId === 'undefined');
