"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUploadConfig = void 0;
var isUploadConfig = function (arg) {
    var uploadConfigArg = arg;
    return (uploadConfigArg &&
        uploadConfigArg.aws &&
        uploadConfigArg.sync &&
        typeof uploadConfigArg.aws.accessKeyId === 'string' &&
        typeof uploadConfigArg.aws.secretAccessKey === 'string' &&
        typeof uploadConfigArg.sync.bucket === 'string' &&
        (typeof uploadConfigArg.sync.prefix === 'string' || typeof uploadConfigArg.sync.prefix === 'undefined') &&
        (Array.isArray(uploadConfigArg.sync.excludePaths) || typeof uploadConfigArg.sync.excludePaths === 'undefined'));
};
exports.isUploadConfig = isUploadConfig;
//# sourceMappingURL=Config.js.map