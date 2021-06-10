"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncDirectoryWithS3 = void 0;
var path_1 = __importDefault(require("path"));
var fs_extra_1 = __importDefault(require("fs-extra"));
var md5_1 = __importDefault(require("md5"));
var mime_1 = __importDefault(require("mime"));
var minimatch_1 = __importDefault(require("minimatch"));
/**
 * Synchronize from a local directory to S3 bucket
 * @param s3 S3 instance
 * @param param1 object for bucket name and directory prefix, paths not to be synchronized
 * @param dirPath the path to local directory to synchronize
 * @returns promise that returns no value
 */
var syncDirectoryWithS3 = function (s3, _a, dirPath) {
    var bucket = _a.bucket, _b = _a.prefix, prefix = _b === void 0 ? '' : _b, excludePaths = _a.excludePaths;
    return __awaiter(void 0, void 0, void 0, function () {
        var posixDirPath, localFiles, s3ObjInfos, s3ObjPairs, s3ObjProcStateMap, uploads, _loop_1, _i, localFiles_1, localFile, deletes, deleteBatches, syncOps, errors, flatErrors, headerErrorMsg, flatErrorMsg, syncErrorMsg;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    posixDirPath = pathWinToPosix(dirPath);
                    console.log("sync " + posixDirPath + " to s3://" + path_1.default.posix.join(bucket, prefix));
                    if (excludePaths !== undefined) {
                        console.log("paths to be excluded:", excludePaths);
                    }
                    console.log('traversing local & S3 files');
                    localFiles = listFilesInLocalDir(posixDirPath);
                    return [4 /*yield*/, listS3Objects(s3, bucket, prefix)];
                case 1:
                    s3ObjInfos = _c.sent();
                    s3ObjPairs = s3ObjInfos
                        .filter(function (obj) { return obj.Key !== undefined && obj.Key !== prefix; })
                        .map(function (obj) { return [
                        obj.Key.replace(prefix, ''),
                        { obj: obj, matched: false }
                    ]; });
                    if (excludePaths !== undefined) {
                        // Exclude pairs that match any of the patterns in excludePaths.
                        s3ObjPairs = s3ObjPairs.filter(function (pair) { return !excludePaths.some(function (excl) { return minimatch_1.default(pair[0], excl); }); });
                    }
                    s3ObjProcStateMap = new Map(s3ObjPairs);
                    console.log('extracting updated & deleted files in local');
                    uploads = [];
                    _loop_1 = function (localFile) {
                        var key = path_1.default.posix.relative(posixDirPath, localFile);
                        // If any of the patterns in excludePaths match, skip them.
                        if (excludePaths !== undefined && excludePaths.some(function (excl) { return minimatch_1.default(key, excl); })) {
                            return "continue";
                        }
                        var s3ObjState = s3ObjProcStateMap.get(key);
                        if (s3ObjState !== undefined) {
                            if (s3ObjState.obj.ETag !== undefined) {
                                var localMD5 = md5_1.default(fs_extra_1.default.readFileSync(localFile));
                                var s3MD5 = JSON.parse(s3ObjState.obj.ETag);
                                if (localMD5 !== s3MD5) {
                                    // MD5 of the local file and the file in S3 do not match.
                                    uploads.push(key);
                                }
                            }
                            else {
                                // MD5 of the file in S3 is undefined, so it will be uploaded, just in case.
                                uploads.push(key);
                            }
                            s3ObjState.matched = true;
                        }
                        else {
                            // File exists locally but not in S3.
                            uploads.push(key);
                        }
                    };
                    for (_i = 0, localFiles_1 = localFiles; _i < localFiles_1.length; _i++) {
                        localFile = localFiles_1[_i];
                        _loop_1(localFile);
                    }
                    deletes = Array.from(s3ObjProcStateMap.entries())
                        .filter(function (kv) { return !kv[1].matched; })
                        .map(function (kv) { return kv[0]; });
                    if (uploads.length === 0 && deletes.length === 0) {
                        console.log('already in sync!');
                        return [2 /*return*/];
                    }
                    // Execute files synchronization.
                    console.log('uploading & deleting files...');
                    deleteBatches = makeKeyBatches(deletes);
                    syncOps = __spreadArray(__spreadArray([], uploads.map(function (key) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                        return [2 /*return*/, uploadToS3(s3, bucket, path_1.default.posix.join(posixDirPath, key), path_1.default.posix.join(prefix, key))];
                    }); }); })), deleteBatches.map(function (keys) { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            return [2 /*return*/, batchDeleteFromS3(s3, bucket, keys.map(function (key) { return path_1.default.posix.join(prefix, key); }))];
                        });
                    }); }));
                    return [4 /*yield*/, Promise.all(syncOps)];
                case 2:
                    errors = (_c.sent()).filter(function (err) { return err !== undefined; });
                    if (errors.length > 0) {
                        flatErrors = errors.flat();
                        headerErrorMsg = flatErrors.length + " error(s)";
                        flatErrorMsg = flatErrors.map(function (err) { return err.key + ": " + err.msg; }).join('\n');
                        syncErrorMsg = headerErrorMsg + "\n" + flatErrorMsg;
                        throw new Error(syncErrorMsg);
                    }
                    console.log('finished!');
                    return [2 /*return*/];
            }
        });
    });
};
exports.syncDirectoryWithS3 = syncDirectoryWithS3;
/**
 * Upload file to S3
 * @param s3 S3 instance
 * @param params request parameters for uploading a file to S3
 * @returns promise that returns S3.PutObjectOutput
 */
var putObjectPromise = function (s3, params) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, new Promise(function (resolve, reject) {
                s3.putObject(params, function (err, data) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(data);
                    }
                });
            })];
    });
}); };
/**
 * Delete object from S3
 * @param s3 S3 instance
 * @param params request parameters to delete an object from S3
 * @returns promise that returns S3.DeleteObjectOutput
 */
var deleteObjectsPromise = function (s3, params) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, new Promise(function (resolve, reject) {
                s3.deleteObjects(params, function (err, data) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(data);
                    }
                });
            })];
    });
}); };
/**
 * Load the file and then upload it
 * @param s3 S3 instance
 * @param bucket bucket name
 * @param localPath path of the local directory
 * @param s3Key key of S3 object
 * @returns promise that returns upload errors or undefined
 */
var uploadToS3 = function (s3, bucket, localPath, s3Key) { return __awaiter(void 0, void 0, void 0, function () {
    var body, err_1, err_2;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                return [4 /*yield*/, fs_extra_1.default.readFile(localPath)];
            case 1:
                body = _b.sent();
                return [3 /*break*/, 3];
            case 2:
                err_1 = _b.sent();
                if (err_1 instanceof Error) {
                    return [2 /*return*/, [{ key: s3Key, msg: "readfileSync: " + err_1.message }]];
                }
                return [2 /*return*/, [{ key: s3Key, msg: 'readfileSync' }]];
            case 3:
                _b.trys.push([3, 5, , 6]);
                return [4 /*yield*/, putObjectPromise(s3, {
                        Body: body,
                        Bucket: bucket,
                        Key: s3Key,
                        ContentType: (_a = mime_1.default.getType(localPath)) !== null && _a !== void 0 ? _a : 'binary/octet-stream'
                    })];
            case 4:
                _b.sent();
                return [3 /*break*/, 6];
            case 5:
                err_2 = _b.sent();
                return [2 /*return*/, [{ key: s3Key, msg: "putObject: " + err_2.message }]];
            case 6:
                console.log('uploaded: %s -> %s', localPath, s3Key);
                return [2 /*return*/, undefined];
        }
    });
}); };
/**
 * Delete objects from S3
 * @param s3 S3 instance
 * @param bucket bucket name
 * @param s3Keys keys of S3 object
 * @returns promise that returns upload errors or undefined
 */
var batchDeleteFromS3 = function (s3, bucket, s3Keys) { return __awaiter(void 0, void 0, void 0, function () {
    var req, result, err_3, failedKeys;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                req = {
                    Bucket: bucket,
                    Delete: {
                        Objects: s3Keys.map(function (k) {
                            return { Key: k };
                        })
                    }
                };
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                return [4 /*yield*/, deleteObjectsPromise(s3, req)];
            case 2:
                result = _b.sent();
                return [3 /*break*/, 4];
            case 3:
                err_3 = _b.sent();
                return [2 /*return*/, [{ key: '(batch)', msg: "deleteObjects: " + err_3.message }]];
            case 4:
                if (result.Deleted !== undefined && result.Deleted.length === s3Keys.length) {
                    // Success!
                    s3Keys.forEach(function (k) { return console.log("deleted: " + k); });
                    return [2 /*return*/, undefined];
                }
                // Partial failure
                ((_a = result.Deleted) !== null && _a !== void 0 ? _a : []).forEach(function (del) { return console.log("deleted: " + del.Key); });
                failedKeys = s3Keys.filter(function (k) { var _a; return ((_a = result.Deleted) !== null && _a !== void 0 ? _a : []).every(function (del) { var _a; return ((_a = del.Key) !== null && _a !== void 0 ? _a : '') !== k; }); });
                return [2 /*return*/, failedKeys.map(function (k) {
                        return { key: k, msg: 'deleteObjects: failed to delete from S3' };
                    })];
        }
    });
}); };
/**
 * List the infomation of the objects in S3
 * @param s3 S3 instance
 * @param bucket bucket name
 * @param prefix prefix of the target directory
 * @returns promise that returns the infomation of the objects in S3
 */
var listS3Objects = function (s3, bucket, prefix) { return __awaiter(void 0, void 0, void 0, function () {
    var p;
    return __generator(this, function (_a) {
        p = new Promise(function (resolve, reject) {
            s3.listObjects({ Bucket: bucket, Prefix: prefix }, function (err, data) {
                if (err) {
                    reject(err);
                }
                else {
                    if (data.Contents === undefined) {
                        reject(Error('listS3Objects: data.Contents is undefined'));
                    }
                    else {
                        resolve(data.Contents);
                    }
                }
            });
        });
        return [2 /*return*/, p];
    });
}); };
/**
 * List the relative paths of files to synchronize
 * @param rootPath path of the root directory
 * @returns list of relative paths of files to synchronize
 */
var listFilesInLocalDir = function (rootPath) {
    var res = [];
    var walk = function (dirPath) {
        for (var _i = 0, _a = fs_extra_1.default.readdirSync(dirPath); _i < _a.length; _i++) {
            var fname = _a[_i];
            var fpath = path_1.default.posix.join(dirPath, fname);
            var fstat = fs_extra_1.default.statSync(fpath);
            if (fstat.isDirectory()) {
                walk(fpath);
            }
            else if (fstat.isFile()) {
                res.push(fpath);
            }
        }
    };
    walk(rootPath);
    return res;
};
/**
 * maximum number of files to be deleted at once
 */
var maxKeyNumInBatch = 1000;
/**
 * Divide the S3 object keys by the number that can be deleted at once
 * @param keys keys of S3 object
 * @returns two-dimensional array of keys divided by a specified number
 */
var makeKeyBatches = function (keys) {
    var res = [];
    for (var i = 0; i < Math.ceil(keys.length / maxKeyNumInBatch); i++) {
        res.push(keys.slice(i * maxKeyNumInBatch, (i + 1) * maxKeyNumInBatch));
    }
    return res;
};
/**
 * Convert path format from win32 to posix
 * @param winPath path format of windows
 * @returns path format of posix
 */
var pathWinToPosix = function (winPath) { return winPath.replace(/\\/g, '/'); };
//# sourceMappingURL=Sync.js.map