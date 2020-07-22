"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const arrivals_1 = require("./arrivals");
arrivals_1.watch()
    .then(() => {
    winston_1.default.info(`Arrivals has started!`);
})
    .catch(err => {
    winston_1.default.error(err);
});
//# sourceMappingURL=run.js.map