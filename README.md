# s3-dir-sync

Command line utility to synchronize from a local directory to s3 bucket with [aws-sdk](https://www.npmjs.com/package/aws-sdk).

## Features

- If there are files with the same path locally and on S3, compare the MD5 hash values and upload only the files with different values
- Upload files that exist only locally
- Delete files that exist only in S3
- Set the appropriate Content-Type based on the file extension when uploading (using mime)

## Install

npm install --save-dev @earlycross-inc/s3-dir-sync

## Configuration

You need to put a s3 config file in your project.
An example upload.config.json:

```
{
  "aws": {
    "accessKeyId": "accessKeyId",
    "secretAccessKey": "secretAccessKey"
  },
  "sync": {
    "bucket": "bucket",
    "prefix": "prefix",
    "excludePaths": ["excludePath"]
  }
}
```

## Command

```
s3-dir-sync --config=[relative path of the s3 config file from the project root] --dir=[relative path of synchronize from the project root]
```

Example:

```
s3-dir-sync --config=./upload.config.json --dir=./dist
```
