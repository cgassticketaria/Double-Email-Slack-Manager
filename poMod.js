const { text } = require("body-parser");
const { createPurchase } = require("./skybox");

async function poModal(body, client, blocks) {

    const salesData = body.message.metadata.event_payload.record;
    const seatRange = salesData.seat.split('-').map(seat => seat.replace(/[^0-9]/g, '').trim());
    const lowSeat = seatRange[0];
    const highSeat = seatRange[seatRange.length - 1];
    const vividId = body.message.metadata.event_payload.vividId;
    const country = body.message.metadata.event_payload.country;
    const ccData = body.message.metadata.event_payload.ccData;
    const record = body.message.metadata.event_payload.record;
    const ccLast4 = ccData.last4;

    let ccType;
    if(ccData.typeId == 1 || ccData.typeId == 7) {
        ccType = "amx"
    } else if(ccData.typeId == 5) {
        ccType = "visa"
    } else if(ccData.typeId == 2 || ccData.typeId == 3 || ccData.typeId == 4 || ccData.typeId == 6) {
        ccType = "mc"
    } else {
        ccType = "unknown please enter"
    }

    try {
        // Generate the modal payload for POing
        const modalPayload = {
            type: "modal",
            callback_id: "send_po",
            title: {
                type: "plain_text",
                text: "SkyBox PO Data", // Ensure this text is less than 25 characters
                emoji: true
            },
            submit: {
                type: "plain_text",
                text: "Submit",
                emoji: true
            },
            close: {
                type: "plain_text",
                text: "Cancel",
                emoji: true
            },
            blocks: [
                {
                    type: "input",
                    optional: false, // This field is mandatory
                    element: {
                        type: "plain_text_input",
                        action_id: "external_reference_input",
                        initial_value: `${salesData.code} ${salesData.email}`,
                        placeholder: {
                            type: "plain_text",
                            text: "Enter external reference"
                        }
                    },
                    label: {
                        type: "plain_text",
                        text: "External Reference",
                        emoji: true
                    }
                },
                {
                    type: "input",
                    optional: false, // This field is mandatory
                    element: {
                        type: "number_input",
                        is_decimal_allowed: false,
                        action_id: "qty_input",
                        initial_value: `${salesData.quantity}`,
                        placeholder: {
                            type: "plain_text",
                            text: "Enter quantity"
                        }
                    },
                    label: {
                        type: "plain_text",
                        text: "Quantity",
                        emoji: true
                    }
                },
                {
                    type: "input",
                    optional: false, // This field is mandatory
                    element: {
                        type: "plain_text_input",
                        action_id: "section_input",
                        initial_value: `${salesData.section}`,
                        placeholder: {
                            type: "plain_text",
                            text: "Enter section"
                        }
                    },
                    label: {
                        type: "plain_text",
                        text: "Section",
                        emoji: true
                    }
                },
                {
                    type: "input",
                    optional: false, // This field is mandatory
                    element: {
                        type: "plain_text_input",
                        action_id: "row_input",
                        initial_value: `${salesData.row}`,
                        placeholder: {
                            type: "plain_text",
                            text: "Enter row"
                        }
                    },
                    label: {
                        type: "plain_text",
                        text: "Row",
                        emoji: true
                    }
                },
                {
                    type: "input",
                    optional: false, // This field is mandatory
                    element: {
                        type: "plain_text_input",
                        action_id: "low_seat_input",
                        initial_value: `${lowSeat}`,
                        placeholder: {
                            type: "plain_text",
                            text: "Enter low seat"
                        }
                    },
                    label: {
                        type: "plain_text",
                        text: "Low Seat",
                        emoji: true
                    }
                },
                {
                    type: "input",
                    optional: false, // This field is mandatory
                    element: {
                        type: "plain_text_input",
                        action_id: "high_seat_input",
                        initial_value: `${highSeat}`,
                        placeholder: {
                            type: "plain_text",
                            text: "Enter high seat"
                        }
                    },
                    label: {
                        type: "plain_text",
                        text: "High Seat",
                        emoji: true
                    }
                },
                {
                    type: "input",
                    optional: false, // This field is mandatory
                    element: {
                        type: "number_input",
                        is_decimal_allowed: true,
                        action_id: "total_cost_input",
                        initial_value: `${Number(salesData.price)}`,
                        placeholder: {
                            type: "plain_text",
                            text: "Enter total cost"
                        }
                    },
                    label: {
                        type: "plain_text",
                        text: "Total Cost",
                        emoji: true
                    }
                },
                {
                    type: "input",
                    optional: false, // This field is mandatory
                    element: {
                        type: "radio_buttons",
                        action_id: "broadcast_radio",
                        initial_option: {
                            text: {
                                type: "plain_text",
                                text: "Yes"
                            },
                            value: "true"
                        },
                        options: [
                            {
                                text: {
                                    type: "plain_text",
                                    text: "Yes"
                                },
                                value: "true"
                            },
                            {
                                text: {
                                    type: "plain_text",
                                    text: "No"
                                },
                                value: "false"
                            }
                        ]
                    },
                    label: {
                        type: "plain_text",
                        text: "Broadcast",
                        emoji: true
                    }
                },
                {
                    type: "input",
                    optional: false, // This field is mandatory
                    element: {
                        type: "static_select",
                        action_id: "stock_type_select",
                        initial_option: {
                            text: {
                                type: "plain_text",
                                text: "Mobile Transfer"
                            },
                            value: "MOBILE_TRANSFER"
                        },
                        options: [
                            {
                                text: {
                                    type: "plain_text",
                                    text: "E-Tickets"
                                },
                                value: "ELECTRONIC"
                            },
                            {
                                text: {
                                    type: "plain_text",
                                    text: "Flash"
                                },
                                value: "FLASH"
                            },
                            {
                                text: {
                                    type: "plain_text",
                                    text: "Hard"
                                },
                                value: "HARD"
                            },
                            {
                                text: {
                                    type: "plain_text",
                                    text: "Mobile QR"
                                },
                                value: "MOBILE_SCREENCAP"
                            },
                            {
                                text: {
                                    type: "plain_text",
                                    text: "Mobile Transfer"
                                },
                                value: "MOBILE_TRANSFER"
                            },
                            {
                                text: {
                                    type: "plain_text",
                                    text: "Paperless Gift Card"
                                },
                                value: "PAPERLESS_CARD"
                            },
                            {
                                text: {
                                    type: "plain_text",
                                    text: "Paperless Walk-In"
                                },
                                value: "PAPERLESS"
                            }
                        ],
                        placeholder: {
                            type: "plain_text",
                            text: "Select stock type"
                        }
                    },
                    label: {
                        type: "plain_text",
                        text: "Stock Type",
                        emoji: true
                    }
                },
                {
                    type: "input",
                    optional: true, // This field is optional
                    element: {
                        type: "plain_text_input",
                        action_id: "public_notes_input",
                        placeholder: {
                            type: "plain_text",
                            text: "Enter public notes"
                        }
                    },
                    label: {
                        type: "plain_text",
                        text: "Public Notes",
                        emoji: true
                    }
                },
                {
                    type: "input",
                    optional: false, // This field is mandatory
                    element: {
                        type: "plain_text_input",
                        action_id: "tags_input",
                        initial_value: `${ccType}_${ccLast4} DB`,
                        placeholder: {
                            type: "plain_text",
                            text: "Enter tags"
                        }
                    },
                    label: {
                        type: "plain_text",
                        text: "Inventory Tags",
                        emoji: true
                    }
                },
                {
                    type: "input",
                    optional: false, // This field is mandatory
                    element: {
                        type: "plain_text_input",
                        action_id: "purchase_order_tags_input",
                        initial_value: `${ccType}_${ccLast4}${(Number(salesData.price)/salesData.quantity) <= 31 ? " ncw25" :""}`,
                        placeholder: {
                            type: "plain_text",
                            text: "Enter purchase order tags"
                        }
                    },
                    label: {
                        type: "plain_text",
                        text: "Purchase Order Tags",
                        emoji: true
                    }
                }
            ],
            private_metadata: JSON.stringify({ channel: body.channel.id, ts: body.message.ts, salesData: salesData, ccData: ccData, vividId: vividId, country: country, record: record}) // Store the channel ID and ts of the original message
        };

        // Open the modal
        await client.views.open({
            token: process.env.SLACK_BOT_TOKEN,
            trigger_id: body.trigger_id,
            view: modalPayload
        });
    } catch (error) {
        console.error('Error opening modal:', error);
    }
}

// Function to handle view submission
async function handleViewSubmission(payload, client) {
    const metadata = JSON.parse(payload.view.private_metadata);
    const channelId = metadata.channel;
    const ts = metadata.ts;
    const record = metadata.record;
    const eventDate = new Date(record.eventDate)
    const inHandDate = new Date(eventDate);
    inHandDate.setDate(eventDate.getDate() - 1);
    const orderNumber = metadata.salesData.code;
    const vividId = metadata.vividId;
    const ccData = metadata.ccData;
    const country = metadata.country;
    const userId = payload.user.id;
    const userInfo = await client.users.info({ user: userId });
    const username = userInfo.user.real_name;
    const userEmail = userInfo.user.profile.email

    // Extract values from the view submission
    const values = payload.view.state.values;
    const keys = Object.keys(payload.view.state.values);

    const skyboxData = {
        vividId: Number(vividId),
        ccData: ccData,
        externalRef: values[keys[0]].external_reference_input.value,
        qty: Number(values[keys[1]].qty_input.value),
        section: values[keys[2]].section_input.value,
        row: values[keys[3]].row_input.value,
        lowSeat: Number(values[keys[4]].low_seat_input.value),
        highSeat: Number(values[keys[5]].high_seat_input.value),
        totalCost: parseFloat(values[keys[6]].total_cost_input.value),
        broadcast: values[keys[7]].broadcast_radio.selected_option.value === "true" ? true : false,
        stockType: values[keys[8]].stock_type_select.selected_option.value,
        publicNotes: values[keys[9]].public_notes_input.value,
        inventoryTag: values[keys[10]].tags_input.value,
        poTag: values[keys[11]].purchase_order_tags_input.value,
        currency: country == "CA" ? "CAD" : "USD",
        inHandDate: inHandDate,
    };

    // Create the tickets array and add it to skyboxData
    const tickets = [];
    const qty = skyboxData.qty;
    const row = skyboxData.row;
    let seat = skyboxData.lowSeat;

    for (let i = 0; i < qty; i++) {
        tickets.push({
            row: row,
            seat: seat + i,
            status: "AVAILABLE"
        });
    }

    skyboxData.tickets = tickets;

    // Send the PO and return the SKybox reference number
    const skyboxRef = await createPurchase(skyboxData, userEmail)

    const blocks = [
        { "type": "divider" },
        {
            "type": "header",
            "text": { "type": "plain_text", "text": `✅ ${orderNumber} (resolved)`, "emoji": true }
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": `*Double Buy*\nRef: ${skyboxRef}\nhttps://skybox.vividseats.com/purchases/${skyboxRef}`
            }
        },
        {
            "type": "context",
            "elements": [{ "type": "mrkdwn", "text": `*Verified by: ${username}` }]
        }
    ];

    await client.chat.update({
        token: process.env.SLACK_BOT_TOKEN,
        channel: channelId,
        ts: ts,
        blocks: blocks,
        text: `✅ ${orderNumber} (resolved) \n *Double Buy* \nPO in SkyBox\nRef: ${skyboxRef}`
    });
}

module.exports = { poModal, handleViewSubmission };
