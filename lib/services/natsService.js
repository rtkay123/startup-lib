"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NatsService = void 0;
const tslib_1 = require("tslib");
const nats_1 = require("nats");
const iStartupConfig_1 = require("../interfaces/iStartupConfig");
const fast_json_stringify_1 = tslib_1.__importDefault(require("fast-json-stringify"));
const message_1 = require("@frmscoe/frms-coe-lib/lib/helpers/schemas/message");
const protobuf_1 = tslib_1.__importDefault(require("@frmscoe/frms-coe-lib/lib/helpers/protobuf"));
class NatsService {
    server = {
        servers: iStartupConfig_1.startupConfig.serverUrl,
    };
    producerStreamName = '';
    consumerStreamName;
    functionName = '';
    NatsConn;
    logger;
    #serialise = (0, fast_json_stringify_1.default)(message_1.messageSchema);
    /**
     * Initialize Nats consumer, supplying a callback function to call every time a new message comes in.
     *
     * @export
     * @param {Function} onMessage Method to be called every time there's a new message. Will be called with two parameters:
     * A json object with the message as parameter;
     * A handleResponse method that should be called when the function is done processing, giving the response object as parameter.
     *
     * The Following environmental variables is required for this function to work:
     * NODE_ENV=debug
     * SERVER_URL=0.0.0.0:4222 <- Nats Server URL
     * FUNCTION_NAME=function_name <- Function Name is used to determine streams.
     *
     * @return {*}  {Promise<boolean>}
     */
    async init(onMessage, loggerService, parConsumerStreamNames, parProducerStreamName) {
        try {
            // Validate additional Environmental Variables.
            if (!iStartupConfig_1.startupConfig.consumerStreamName && !parConsumerStreamNames?.length) {
                throw new Error(`No Consumer Stream Name Provided in environmental Variable or on startup as an arguement`);
            }
            if (parProducerStreamName)
                iStartupConfig_1.startupConfig.producerStreamName = parProducerStreamName;
            if (parConsumerStreamNames)
                iStartupConfig_1.startupConfig.consumerStreamName = String(parConsumerStreamNames);
            await this.initProducer(loggerService, parProducerStreamName);
            if (!this.NatsConn || !this.logger)
                return await Promise.resolve(false);
            // this promise indicates the client closed
            const done = this.NatsConn.closed();
            // Add consumer streams
            this.consumerStreamName = iStartupConfig_1.startupConfig.consumerStreamName.split(',');
            const subs = [];
            for (const consumerStream of this.consumerStreamName) {
                subs.push(this.NatsConn.subscribe(`${consumerStream}`, { queue: `${this.functionName}` }));
            }
            (async () => {
                for (const sub of subs) {
                    this.subscribe(sub, onMessage);
                }
            })();
        }
        catch (err) {
            this.logger?.log(`Error communicating with NATS on: ${JSON.stringify(this.server)}, with error: ${JSON.stringify(err)}`);
            throw err;
        }
        return true;
    }
    async subscribe(subscription, onMessage) {
        for await (const message of subscription) {
            console.debug(`${Date.now().toLocaleString()} sid:[${message?.sid}] subject:[${message.subject}]: ${message.data.length}`);
            const messageDecoded = protobuf_1.default.decode(message.data);
            const messageObject = protobuf_1.default.toObject(messageDecoded);
            await onMessage(messageObject, this.handleResponse);
        }
    }
    /**
     * Initialize Nats Producer
     *
     * @export
     * @param {Function} loggerService
     *
     * Method to init Producer Stream. This function will not react to incomming NATS messages.
     * The Following environmental variables is required for this function to work:
     * NODE_ENV=debug
     * SERVER_URL=0.0.0.0:4222 - Nats Server URL
     * FUNCTION_NAME=function_name - Function Name is used to determine streams.
     * PRODUCER_STREAM - Stream name for the producer Stream
     *
     * @return {*}  {Promise<boolean>}
     */
    async initProducer(loggerService, parProducerStreamName) {
        await this.validateEnvironment(parProducerStreamName);
        if (loggerService) {
            this.logger = iStartupConfig_1.startupConfig.env === 'dev' || iStartupConfig_1.startupConfig.env === 'test' ? console : loggerService;
        }
        else {
            this.logger = console;
        }
        try {
            // Connect to NATS Server
            this.logger.log(`Attempting connection to NATS, with config:\n${JSON.stringify(iStartupConfig_1.startupConfig, null, 4)}`);
            this.NatsConn = await (0, nats_1.connect)(this.server);
            this.logger.log(`Connected to ${this.NatsConn.getServer()}`);
            this.functionName = iStartupConfig_1.startupConfig.functionName.replace(/\./g, '_');
            // Init producer streams
            this.producerStreamName = iStartupConfig_1.startupConfig.producerStreamName;
            if (parProducerStreamName)
                this.producerStreamName = parProducerStreamName;
        }
        catch (error) {
            this.logger.log(`Error communicating with NATS on: ${JSON.stringify(this.server)}, with error: ${JSON.stringify(error)}`);
            throw error;
        }
        this.NatsConn.closed().then(async () => {
            this.logger.log('Connection Lost to NATS Server.');
        });
        return true;
    }
    async validateEnvironment(parProducerStreamName) {
        if (!iStartupConfig_1.startupConfig.producerStreamName && !parProducerStreamName) {
            throw new Error(`No Producer Stream Name Provided in environmental Variable or on startup as an arguement`);
        }
        if (!iStartupConfig_1.startupConfig.serverUrl) {
            throw new Error(`No Server URL was Provided in environmental Variable`);
        }
        if (!iStartupConfig_1.startupConfig.functionName) {
            throw new Error(`No Function Name was Provided in environmental Variable`);
        }
    }
    /**
     * Handle the response once the function executed by onMessage is complete. Publish it to the Producer Stream
     *
     * @export
     * @param {string} response Response string to be send to the producer stream.
     *
     * @return {*}  {Promise<void>}
     */
    async handleResponse(response, subject) {
        const message = protobuf_1.default.create(response);
        const messageBuffer = protobuf_1.default.encode(message).finish();
        if (this.producerStreamName && this.NatsConn) {
            if (!subject) {
                this.NatsConn.publish(this.producerStreamName, messageBuffer);
            }
            else {
                for (const sub of subject) {
                    this.NatsConn.publish(sub, messageBuffer);
                }
            }
        }
    }
}
exports.NatsService = NatsService;
//# sourceMappingURL=natsService.js.map