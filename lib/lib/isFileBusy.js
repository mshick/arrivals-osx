"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFileBusy = void 0;
const opened = __importStar(require("@ronomon/opened"));
const winston_1 = __importDefault(require("winston"));
async function isFileBusy(source) {
    return new Promise(resolve => {
        opened.file(source, (err, busy) => {
            if (err) {
                winston_1.default.debug(`Problem checking for busy file: %s`, err.message);
                resolve(false);
            }
            resolve(busy);
        });
    });
}
exports.isFileBusy = isFileBusy;
//# sourceMappingURL=isFileBusy.js.map