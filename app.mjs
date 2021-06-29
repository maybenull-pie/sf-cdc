import bunyan from 'bunyan';
import Worker from './worker.mjs';

const STATUS_UP = 'Up';
const STATUS_DOWN = 'Down';

class App {
    constructor(config) {
        this.status = STATUS_DOWN;
        this.logger = bunyan.createLogger({name: 'sf-cdc'});   
        this.worker = new Worker(this.logger, 
        {
            loginUrl: config.sfLoginUrl,
            username: config.sfUsername,
            password: config.sfPassword,
            token: config.sfToken
        },
        '/data/LeadChangeEvent', 
        {
            topicArn: config.awsTopicArn,
            apiVersion: config.awsApiVersion
        });
    }

    async start() {
        this.logger.info('App starting');

        await this.worker.start();
        this.status = STATUS_UP;

        this.logger.info('App started');
    }

    async stop() {
        this.logger.info('App stopping');

        await this.worker.stop();
        this.status = STATUS_DOWN;

        this.logger.info('App stopped');
    }
}
export default App;