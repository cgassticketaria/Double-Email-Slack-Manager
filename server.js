require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cron = require('node-cron');
const { verifiedButtonClick, actionSelection } = require('./slack_manager/mainInteract');
const { App } = require('@slack/bolt');
const { handleViewSubmission } = require('./slack_manager/poMod');

const botApp = new App({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    token: process.env.SLACK_BOT_TOKEN,
    socketMode: true,
    appToken: process.env.SLACK_APP_TOKEN
});

const PORT = process.env.PORT || 3000;
const app = express();
app.use(bodyParser.json());

botApp.action('verified_button_click', async ({ ack, body, client }) => {
    try {
        await ack();
        await verifiedButtonClick(body, client);
    } catch (error) {
        console.error('Error handling verified_button_click action:', error);
    }
});

botApp.action('action_selection', async ({ ack, body, client }) => {
    await ack();
    await actionSelection(body, client);
});

botApp.view('send_po', async ({ ack, body, view, client }) => {
    await ack();
    try {
        await handleViewSubmission(body, client);
    } catch (error) {
        console.error('Error handling view submission:', error);
    }
});

// Health check endpoint
app.get('/', (req, res) => {
    res.status(200).send('OK');
});

// Launch the bot/app
(async () => {
    await botApp.start(PORT);
    console.log('⚡️ Bolt app is running!');
})();

// Start the Express server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Cron job to check the time every 10 minutes
cron.schedule('*/10 * * * *', () => {
    console.log("Health Check");
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    if (hours === 0 && minutes < 10) {
        console.log("Health check good");
    }
});
