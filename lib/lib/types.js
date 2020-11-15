"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileJobStatus = exports.FileJobType = void 0;
var FileJobType;
(function (FileJobType) {
    FileJobType[FileJobType["ConvertAudio"] = 0] = "ConvertAudio";
    FileJobType[FileJobType["ConvertVideo"] = 1] = "ConvertVideo";
    FileJobType[FileJobType["CopyAudio"] = 2] = "CopyAudio";
    FileJobType[FileJobType["CopyVideo"] = 3] = "CopyVideo";
    FileJobType[FileJobType["Unknown"] = 4] = "Unknown";
})(FileJobType = exports.FileJobType || (exports.FileJobType = {}));
var FileJobStatus;
(function (FileJobStatus) {
    FileJobStatus[FileJobStatus["Pending"] = 0] = "Pending";
    FileJobStatus[FileJobStatus["Existing"] = 1] = "Existing";
    FileJobStatus[FileJobStatus["Complete"] = 2] = "Complete";
    FileJobStatus[FileJobStatus["InProgress"] = 3] = "InProgress";
    FileJobStatus[FileJobStatus["Unhandled"] = 4] = "Unhandled";
    FileJobStatus[FileJobStatus["Error"] = 5] = "Error";
})(FileJobStatus = exports.FileJobStatus || (exports.FileJobStatus = {}));
//# sourceMappingURL=types.js.map