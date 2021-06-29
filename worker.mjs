import jsforce from 'jsforce';
import aws from 'aws-sdk';
import DB from './db.mjs';  

const STATUS_INITIALIZED = "Initialized";
const STATUS_STARTING = "Starting";
const STATUS_STARTED = "Started";
const STATUS_STOPPING = "Stopping";
const STATUS_STOPPED = "Stopped";

class Worker {
    constructor(logger, sfConfig, cdcTopic, awsConfig) {
        this.status = STATUS_INITIALIZED;
        this.logger = logger;
        this.db = new DB(this.logger);
        this.sfConfig = sfConfig;
        this.awsConfig = awsConfig;
        this.cdcTopic = cdcTopic;
        this.replayId = null;
        this.salesforce = null;
        this.cdc = null;
        this.sns = new aws.SNS({ apiVersion: awsConfig.apiVersion, region: 'us-east-1' }); // region should not be required but need for sandbox right now?
    }

    async start() {
        this.salesforce = new jsforce.Connection({ loginUrl: this.sfConfig.loginUrl });
        
        if (! (this.status === STATUS_INITIALIZED || this.status === STATUS_STOPPED)) {
            throw new Error(`Cannot start worker whose status is ${this.status}`);
        }

        this.#setStatus(STATUS_STARTING);
        
        this.salesforce = new jsforce.Connection({ loginUrl: this.sfConfig.loginUrl });

        await this.salesforce.login(this.sfConfig.username, this.sfConfig.password + this.sfConfig.token);
       
        this.replayId = await this.db.readReplayId(this.cdcTopic);
        this.logger.info({topic: this.cdcTopic}, 'Creating salesforce connection');
        this.cdc = this.salesforce.streaming.createClient([ 
            new jsforce.StreamingExtension.Replay(this.cdcTopic, this.replayId),
            new jsforce.StreamingExtension.AuthFailure(() => {
                this.logger.info('Salesforce auth failure while streaming.');
                this.restart().bind(this);
            })
        ]);
       
        this.logger.info({topic: this.cdcTopic}, 'Subscribing salesforce topic');
        return this.cdc.subscribe(this.cdcTopic, async (data) => {
            this.logger.info({topic: this.cdcTopic, recievedReplayId: data.event.replayId, currentReplayId: this.replayId}, 'Publishing SNS');

            this.replayId = await this.db.saveReplayId(this.cdcTopic, data.event.replayId);
            const message = {
                FileName: 'foo',
                FolderId: 'bar',
                Foo: data.payload.Phone // only phone number changes from sf for now
            };

            // MessageTypeFullName needed for easy processing with NServiceBus
            // MessageTypeFullName value comes from Policy branch spike/INS-1337-native-spike
            return await this.sns.publish({
                Message: Buffer.from(JSON.stringify(message)).toString('base64'),
                MessageAttributes: {
                    "MessageTypeFullName": {
                        "DataType": "String",
                        "StringValue": "Message.From.SomeWhere.ISqsHappened"
                    }
                },
                TopicArn: this.awsConfig.topicArn
            }).promise();
        });
    }

    async stop() { 
        if (! this.status === STATUS_STARTED) {
            throw new Error(`Cannot stop worker whose status is ${this.status}`);
        }

        this.#setStatus(STATUS_STOPPING);
        
        if (this.cdc == null) {
            return;
        }

        await this.db.saveReplayId(this.cdcTopic, this.replayId);
        await this.cdc.disconnect();
        await this.salesforce.logout();

        this.cdc = null;
        this.salesforce = null;
        this.#setStatus(STATUS_STOPPED);
    }

    async restart() {
        await this.stop();
        return await this.start();
    }

    #setStatus(status) {
        this.status = STATUS_STOPPED;
        this.logger.info({topic: this.cdcTopic}, `Worker ${status}`);        
    }
}
export default Worker;