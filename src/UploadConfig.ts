export interface UploadConfig {
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  prefix: string;
  cloudFrontId?: string;
}
