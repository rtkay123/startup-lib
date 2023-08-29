"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startupConfig = void 0;
const tslib_1 = require("tslib");
const dotenv_1 = require("dotenv");
const path_1 = tslib_1.__importDefault(require("path"));
// Load .env file into process.env if it exists. This is convenient for running locally.
(0, dotenv_1.config)({
    path: path_1.default.resolve(__dirname, '../.env'),
});
exports.startupConfig = {
    startupType: process.env.STARTUP_TYPE,
    env: process.env.NODE_ENV,
    serverUrl: process.env.SERVER_URL,
    functionName: process.env.FUNCTION_NAME,
    producerStreamName: process.env.PRODUCER_STREAM,
    consumerStreamName: process.env.CONSUMER_STREAM,
    streamSubject: process.env.STREAM_SUBJECT,
    producerRetentionPolicy: process.env.PRODUCER_RETENTION_POLICY || 'Workqueue',
    ackPolicy: process.env.ACK_POLICY || 'Explicit',
    producerStorage: process.env.PRODUCER_STORAGE || 'Memory',
};
//# sourceMappingURL=iStartupConfig.js.map