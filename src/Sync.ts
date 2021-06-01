import path from 'path';
import { AWSError, S3 } from 'aws-sdk';
import fs from 'fs-extra';
import md5 from 'md5';
import mime from 'mime';
import minimatch from 'minimatch';
import { SyncConfig } from './Config';

export const syncDirectoryWithS3 = async (
  s3: S3,
  { bucket, prefix = '', excludePaths }: SyncConfig,
  dirPath: string
): Promise<void> => {
  console.log(`sync ${dirPath} to s3://${path.join(bucket, prefix)}`);
  if (excludePaths !== undefined) {
    console.log(`paths to be excluded:`, excludePaths);
  }
  console.log('traversing local & S3 files');
  const localFiles = listFilesInLocalDir(dirPath);
  const s3ObjInfos = await listS3Objects(s3, bucket, prefix);

  interface S3ObjProcState {
    obj: S3.Object;
    matched: boolean;
  }
  let s3ObjPairs = s3ObjInfos
    .filter(obj => obj.Key !== undefined && obj.Key !== prefix)
    .map<[string, S3ObjProcState]>(obj => [
      (obj.Key as string).replace(prefix, ''), // Make it a "relative key" based on the prefix.
      { obj, matched: false }
    ]);
  if (excludePaths !== undefined) {
    // Exclude pairs that match any of the patterns in excludePaths.
    s3ObjPairs = s3ObjPairs.filter(pair => !excludePaths.some(excl => minimatch(pair[0], excl)));
  }

  const s3ObjProcStateMap = new Map(s3ObjPairs);

  console.log('extracting updated & deleted files in local');
  const uploads = [];
  for (const localFile of localFiles) {
    const key = path.relative(dirPath, localFile).replace(/\\/g, '/');
    // If any of the patterns in excludePaths match, skip them.
    if (excludePaths !== undefined && excludePaths.some(excl => minimatch(key, excl))) {
      continue;
    }
    const s3ObjState = s3ObjProcStateMap.get(key);

    if (s3ObjState !== undefined) {
      if (s3ObjState.obj.ETag !== undefined) {
        const localMD5 = md5(fs.readFileSync(localFile));
        const s3MD5 = JSON.parse(s3ObjState.obj.ETag) as string;
        if (localMD5 !== s3MD5) {
          // MD5 of the local file and the file in S3 do not match.
          uploads.push(key);
        }
      } else {
        // MD5 of the file in S3 is undefined, so it will be uploaded, just in case.
        uploads.push(key);
      }
      s3ObjState.matched = true;
    } else {
      // File exists locally but not in S3.
      uploads.push(key);
    }
  }
  // Delete files that do not exist locally.
  const deletes = Array.from(s3ObjProcStateMap.entries())
    .filter(kv => !kv[1].matched)
    .map(kv => kv[0]);

  if (uploads.length === 0 && deletes.length === 0) {
    console.log('already in sync!');
    return;
  }

  // Execute files synchronization.
  console.log('uploading & deleting files...');
  const deleteBatches = makeKeyBatches(deletes);
  const syncOps = [
    ...uploads.map(async key => uploadToS3(s3, bucket, path.join(dirPath, key), path.join(prefix, key))),
    ...deleteBatches.map(async keys =>
      batchDeleteFromS3(
        s3,
        bucket,
        keys.map(key => path.join(prefix, key))
      )
    )
  ];

  const errors = (await Promise.all(syncOps)).filter((err): err is Exclude<typeof err, undefined> => err !== undefined);
  if (errors.length > 0) {
    console.error(`${errors.length} error(s):`);
    errors.flat().forEach(err => console.error(`${err.key}: ${err.msg}`));
    return;
  }
  console.log('finished!');
};

interface UploadError {
  key: string;
  msg: string;
}

const putObjectPromise = async (s3: S3, params: S3.PutObjectRequest): Promise<S3.PutObjectOutput> =>
  new Promise((resolve, reject) => {
    s3.putObject(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });

const deleteObjectsPromise = async (s3: S3, params: S3.DeleteObjectsRequest): Promise<S3.DeleteObjectOutput> =>
  new Promise((resolve, reject) => {
    s3.deleteObjects(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });

const uploadToS3 = async (
  s3: S3,
  bucket: string,
  localPath: string,
  s3Key: string
): Promise<UploadError[] | undefined> => {
  let body: Buffer;
  try {
    body = await fs.readFile(localPath);
  } catch (err) {
    if (err instanceof Error) {
      return [{ key: s3Key, msg: `readfileSync: ${err.message}` }];
    }
    return [{ key: s3Key, msg: 'readfileSync' }];
  }

  try {
    await putObjectPromise(s3, {
      Body: body,
      Bucket: bucket,
      Key: s3Key,
      ContentType: mime.getType(localPath) ?? 'binary/octet-stream'
    });
  } catch (err) {
    return [{ key: s3Key, msg: `putObject: ${(err as AWSError).message}` }];
  }
  console.log('uploaded: %s -> %s', localPath, s3Key);
  return undefined;
};

const batchDeleteFromS3 = async (s3: S3, bucket: string, s3Keys: string[]): Promise<UploadError[] | undefined> => {
  const req: S3.DeleteObjectsRequest = {
    Bucket: bucket,
    Delete: {
      Objects: s3Keys.map(k => {
        return { Key: k };
      })
    }
  };

  let result: S3.DeleteObjectsOutput;
  try {
    result = await deleteObjectsPromise(s3, req);
  } catch (err) {
    return [{ key: '(batch)', msg: `deleteObjects: ${(err as AWSError).message}` }];
  }

  if (result.Deleted !== undefined && result.Deleted.length === s3Keys.length) {
    // Success!
    s3Keys.forEach(k => console.log(`deleted: ${k}`));
    return undefined;
  }

  // Partial failure
  (result.Deleted ?? []).forEach(del => console.log(`deleted: ${del.Key}`));
  // Extract the keys that were not deleted.
  const failedKeys = s3Keys.filter(k => (result.Deleted ?? []).every(del => (del.Key ?? '') !== k));
  return failedKeys.map(k => {
    return { key: k, msg: 'deleteObjects: failed to delete from S3' };
  });
};

const listS3Objects = async (s3: S3, bucket: string, prefix: string): Promise<S3.ObjectList> => {
  const p = new Promise<S3.ObjectList>((resolve, reject) => {
    s3.listObjects({ Bucket: bucket, Prefix: prefix }, (err, data) => {
      if (err) {
        reject(err);
      } else {
        if (data.Contents === undefined) {
          reject(Error('listS3Objects: data.Contents is undefined'));
        } else {
          resolve(data.Contents);
        }
      }
    });
  });
  return p;
};

const listFilesInLocalDir = (rootPath: string): string[] => {
  const res: string[] = [];

  const walk = (dirPath: string): void => {
    for (const fname of fs.readdirSync(dirPath)) {
      const fpath = path.join(dirPath, fname);
      const fstat = fs.statSync(fpath);

      if (fstat.isDirectory()) {
        walk(fpath);
      } else if (fstat.isFile()) {
        res.push(fpath);
      }
    }
  };
  walk(rootPath);
  return res;
};

const maxKeyNumInBatch = 1000;
const makeKeyBatches = (keys: string[]): string[][] => {
  const res: string[][] = [];
  for (let i = 0; i < Math.ceil(keys.length / maxKeyNumInBatch); i++) {
    res.push(keys.slice(i * maxKeyNumInBatch, (i + 1) * maxKeyNumInBatch));
  }
  return res;
};
