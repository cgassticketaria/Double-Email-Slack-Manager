require('dotenv').config();
const { App } = require('@slack/bolt');
const axios = require('axios');

const botApp = new App({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    token: process.env.SLACK_BOT_TOKEN,
    socketMode: true,
    appToken: process.env.SLACK_APP_TOKEN
});

const PORT = process.env.PORT || 8080;

const channelId = process.env.SLACK_CHANNEL_ID;

// Define your Slack actions and listeners
botApp.action('verified_button_click', async ({ ack, body, client }) => {
    try {
        // Acknowledge the action
        await ack();
        let blocks = body.message.blocks;
        const fileId = body.message.metadata.event_payload.file_id;
    
        const orderNumber = blocks[2].fields[0].text.split(":*\n")[1];
    
        // Get the user ID of the user who clicked the button
        const userId = body.user.id;
        // Retrieve the username of the user who clicked the button
        const userInfo = await client.users.info({
          user: userId
        });
        const username = userInfo.user.real_name;
    
        let salesOrderNumber = null;
        const keys = Object.keys(body.state.values);
        keys.forEach(key => {
            if (body.state.values[key]['plain_text_input-action']) {
              salesOrderNumber = body.state.values[key]['plain_text_input-action'].value;
            }
        });
    
        blocks = [];
        blocks.push(
          {
            "type": "divider"
          },
          {
            "type": "header",
            "text": {
              "type": "plain_text",
              "text": `✅ ${orderNumber} (resolved)`,
              "emoji": true
            }
          }
        );
    
        if (salesOrderNumber) {
          blocks.push(
            {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": `✔️ *Not A Double Buy* ✔️\nSales Order: ${salesOrderNumber}`
              }
            }
          );
        } else {
          blocks.push(
            {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": `⚠️ *Double Buy* ⚠️\nPO in SkyBox`
              }
            }
          );
        }
    
        blocks.push({
          "type": "context",
          "elements": [
            {
              "type": "mrkdwn",
              "text": `*Verified by: ${username}`
            }
          ]
        });
        
    
        // Update the message with the new blocks
        await axios.post(body.response_url, { blocks });
    
        // Delete the CSV file from the channel using the fileId
        await botApp.client.files.delete({
          file: fileId
        });
    
      } catch (error) {
        console.error('Error handling verified_button_click action:', error);
      }
});

botApp.action('action_selection', async ({ ack, body, client }) => {
    try {
        // Acknowledge the action
        await ack();
    
        const action = body.actions[0];
        const blocks = body.message.blocks;
    
        // Check if the button block already exists
        const isButtonBlockPresent = blocks.some(block => {
          return (
            block.type === "actions" &&
            block.elements.some(element => element.type === "button" && element.action_id === "verified_button_click")
          );
        });
    
        if (isButtonBlockPresent) {
          blocks.pop();
        };
        
        // Check if the action has a selected_option property
        if (action.selected_option) {
          const optionValue = action.selected_option.value;
    
          // Check if the "Sales Order Number" input block is already present
          const isInputBlockPresent = blocks.some(block => {
            return (
              block.type === "input" &&
              block.label &&
              block.label.text === "Sales Order Number"
            );
          });
    
          // If the input block is not already present and option is 2, push it to the blocks array
          if (optionValue === "2" && !isInputBlockPresent) {
            blocks.push({
              "type": "input",
              "element": {
                "type": "plain_text_input",
                "action_id": "plain_text_input-action"
              },
              "label": {
                "type": "plain_text",
                "text": "Sales Order Number",
                "emoji": true
              }
            });
          } else if (optionValue === "1" && isInputBlockPresent) {
            blocks.pop();
          }
        
          blocks.push({
            "type": "actions",
            "elements": [
              {
                "type": "button",
                "text": {
                  "type": "plain_text",
                  "emoji": true,
                  "text": "Confirm"
                },
                "style": "primary",
                "action_id": "verified_button_click"
              }
            ]
          });
          
        }
    
        // Update the message with the new blocks
        await axios.post(body.response_url, { blocks });
    
      } catch (error) {
        console.error('Error:', error);
      }
});

// Launch the bot/app
(async () => {
    // Start your app
    await botApp.start(PORT);
    console.log('⚡️ Bolt app is running!');
})();