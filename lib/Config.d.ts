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
export declare const isUploadConfig: (arg: unknown) => arg is UploadConfig;
