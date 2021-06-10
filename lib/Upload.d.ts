/**
 * Upload to s3
 * @param configPath the path to config file
 * @param localDirPath the path to local directory to synchronize
 */
export declare const upload: (configPath: string, localDirPath: string) => Promise<void>;
