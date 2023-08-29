"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StartupFactory = void 0;
const iStartupConfig_1 = require("../interfaces/iStartupConfig");
const jetstreamService_1 = require("./jetstreamService");
const natsService_1 = require("./natsService");
class StartupFactory {
    startupService;
    /**
     *  Initializes a new startup service which would either be a Jetstream or Nats server, depending on the configurd SERVER_TYPE env variable ('nats' | 'jestream')
     */
    constructor() {
        switch (iStartupConfig_1.startupConfig.startupType) {
            case 'jetstream':
                this.startupService = new jetstreamService_1.JetstreamService();
                break;
            case 'nats':
                this.startupService = new natsService_1.NatsService();
                break;
            default:
                throw new Error('STARTUP_TYPE not set to a correct value.');
        }
    }
    /* eslint-disable @typescript-eslint/no-misused-promises */
    async init(onMessage, loggerService) {
        process.on('uncaughtException', async () => {
            await this.startupService.init(onMessage, loggerService);
        });
        process.on('unhandledRejection', async () => {
            await this.startupService.init(onMessage, loggerService);
        });
        return await this.startupService.init(onMessage, loggerService);
    }
    async initProducer(loggerService) {
        process.on('uncaughtException', async () => {
            await this.startupService.initProducer(loggerService);
        });
        process.on('unhandledRejection', async () => {
            await this.startupService.initProducer(loggerService);
        });
        return await this.startupService.initProducer(loggerService);
    }
    async handleResponse(response, subject) {
        await this.startupService.handleResponse(response, subject);
    }
}
exports.StartupFactory = StartupFactory;
//# sourceMappingURL=startupFactory.js.map