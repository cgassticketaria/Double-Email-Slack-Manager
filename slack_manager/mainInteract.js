const axios = require('axios');
const { poModal } = require('./poMod');

async function verifiedButtonClick(body, client) {
    let blocks = body.message.blocks;
    let fileId = null;
    if (body.message.metadata && body.message.metadata.event_payload && body.message.metadata.event_payload.file_id) {
        fileId = body.message.metadata.event_payload.file_id;
    }

    const orderNumber = blocks[2].text.text.split(" \n")[0];

    const userId = body.user.id;
    const userInfo = await client.users.info({ user: userId });
    const username = userInfo.user.real_name;

    let refNumber = null;
    const keys = Object.keys(body.state.values);
    keys.forEach(key => {
        if (body.state.values[key]['plain_text_input-action']) {
            refNumber = body.state.values[key]['plain_text_input-action'].value;
        }
    });

    const isInputBlockPresent = blocks.some(block => block.type === "input" && block.label && block.label.text === "Sales Order Number");

    if (isInputBlockPresent && !refNumber) return;

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
                "text": `✔️ *Not A Double Buy* ✔️\nRef: ${refNumber}`
            }
        },
        {
            "type": "context",
            "elements": [{ "type": "mrkdwn", "text": `*Verified by: ${username}` }]
        }
    ];

    await axios.post(body.response_url, { blocks });
    // if (fileId) {
    //     await client.files.delete({ file: fileId });
    // }
}

async function actionSelection(body, client) {
    try {
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

                blocks.push({
                    "type": "actions",
                    "elements": [{
                        "type": "button",
                        "text": { "type": "plain_text", "emoji": true, "text": "Confirm" },
                        "style": "primary",
                        "action_id": "verified_button_click"
                    }]
                });
            } else if (optionValue === "1") {
                await poModal(body, client, blocks);
            }
        }

        await axios.post(body.response_url, { blocks });

    } catch (error) {
        console.error('Error:', error);
    }
}

module.exports = { verifiedButtonClick, actionSelection };
