require('dotenv').config();
const { App } = require('@slack/bolt');
const axios = require('axios');
const express = require('express');
const bodyParser = require('body-parser');
const cron = require('node-cron');

const botApp = new App({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    token: process.env.SLACK_BOT_TOKEN,
    socketMode: true,
    appToken: process.env.SLACK_APP_TOKEN
});

const PORT = process.env.PORT || 3000;
const app = express();
app.use(bodyParser.json());

const channelId = process.env.SLACK_CHANNEL_ID;

// Define your Slack actions and listeners
botApp.action('verified_button_click', async ({ ack, body, client }) => {
    try {
        await ack();
        let blocks = body.message.blocks;
        let fileId = null;
        if(body.message.metadata.event_payload) {
            fileId = body.message.metadata.event_payload.file_id;
        }
    
        const orderNumber = blocks[2].fields[0].text.split(":*\n")[1];
    
        const userId = body.user.id;
        const userInfo = await client.users.info({ user: userId });
        const username = userInfo.user.real_name;
    
        let salesOrderNumber = null;
        const keys = Object.keys(body.state.values);
        keys.forEach(key => {
            if (body.state.values[key]['plain_text_input-action']) {
                salesOrderNumber = body.state.values[key]['plain_text_input-action'].value;
            }
        });

        const isInputBlockPresent = blocks.some(block => block.type === "input" && block.label && block.label.text === "Sales Order Number");

        if (isInputBlockPresent && !salesOrderNumber) return;
    
        blocks = [
            { "type": "divider" },
            {
                "type": "header",
                "text": { "type": "plain_text", "text": `✅ ${orderNumber} (resolved)`, "emoji": true }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": salesOrderNumber ? `✔️ *Not A Double Buy* ✔️\nSales Order: ${salesOrderNumber}` : `⚠️ *Double Buy* ⚠️\nPO in SkyBox`
                }
            },
            {
                "type": "context",
                "elements": [{ "type": "mrkdwn", "text": `*Verified by: ${username}` }]
            }
        ];
    
        await axios.post(body.response_url, { blocks });
        if (fileId) {
            await botApp.client.files.delete({ file: fileId });
        }
    
    } catch (error) {
        console.error('Error handling verified_button_click action:', error);
    }
});

botApp.action('action_selection', async ({ ack, body, client }) => {
    try {
        await ack();
    
        const action = body.actions[0];
        let blocks = body.message.blocks;
    
        const isButtonBlockPresent = blocks.some(block => block.type === "actions" && block.elements.some(element => element.type === "button" && element.action_id === "verified_button_click"));
        if (isButtonBlockPresent) blocks.pop();

        const isInputBlockPresent = blocks.some(block => block.type === "input" && block.label && block.label.text === "Sales Order Number");
        if (isInputBlockPresent) blocks.pop();
        
        if (action.selected_option) {
            const optionValue = action.selected_option.value;
  
            if (optionValue === "2" && !isInputBlockPresent) {
                blocks.push({
                    "type": "input",
                    "element": { "type": "plain_text_input", "action_id": "plain_text_input-action" },
                    "label": { "type": "plain_text", "text": "Sales Order Number", "emoji": true }
                });
            } else if (optionValue === "1" && isInputBlockPresent) {
                blocks.pop();
            }
        
            blocks.push({
                "type": "actions",
                "elements": [{
                    "type": "button",
                    "text": { "type": "plain_text", "emoji": true, "text": "Confirm" },
                    "style": "primary",
                    "action_id": "verified_button_click"
                }]
            });
        }
    
        await axios.post(body.response_url, { blocks });
    
    } catch (error) {
        console.error('Error:', error);
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
