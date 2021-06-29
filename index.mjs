import dotenv from 'dotenv';
import App from './app.mjs';

dotenv.config();

const app = new App({
    sfLoginUrl: process.env.SF_LOGIN_URL,
    sfUsername: process.env.SF_USERNAME,
    sfPassword: process.env.SF_PASSWORD,
    sfToken: process.env.SF_TOKEN,
    awsTopicArn: process.env.AWS_TOPIC_ARN,
    awsApiVersion: process.env.AWS_API_VERSION
});

try {
    await app.start();
} catch(error) {
    console.log(error);
    process.exit(1);
}
