// wrapper around whatever db (probably dynamodb or mongo)
class DB {
    constructor(logger) {
        this.logger = logger;
    }

    async connect() {
        this.logger.info('Connectiing DB');
    }

    async readReplayId(topic) {
        let replayId = -1;
        this.logger.info({topic, replayId}, 'Read replay id');
        return replayId;
    }

    async saveReplayId(topic, replayId) {
        this.logger.info({topic, replayId}, 'Saved replay id');
        return replayId;
    }

    async disconnect() {
        this.logger.info('Disconnectiing DB');
    }

}
export default DB;