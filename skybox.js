require('dotenv').config();
const axios = require('axios');

// Load environment variables
const SKYBOX_API_KEY = process.env.SKYBOX_API_KEY;
const SKYBOX_APPLICATION_KEY = process.env.SKYBOX_APPLICATION_KEY;
const SKYBOX_ACCOUNT_ID = process.env.SKYBOX_ACCOUNT_ID;

const url = 'https://skybox.vividseats.com/services/purchases';

const headers = {
  'accept': 'application/json',
  'Content-Type': 'application/json',
  'X-Api-Token': SKYBOX_API_KEY,
  'X-Application-Token': SKYBOX_APPLICATION_KEY,
  'X-Account': SKYBOX_ACCOUNT_ID
};

async function createPurchase(skyboxData, userEmail) {
  const data = {
    vendorId: 1427,
    eventId: skyboxData.vividId,
    tags: skyboxData.poTag,
    externalRef: skyboxData.externalRef,
    currencyCode: skyboxData.currency,
    createdBy: `${userEmail} via Slack`,
    lines: [
      {
        lineType: "PURCHASE",
        lineItemType: "INVENTORY",
        amount: skyboxData.totalCost,
        inventory: {
          eventId: skyboxData.vividId,
          section: skyboxData.section,
          row: skyboxData.row,
          lowSeat: skyboxData.lowSeat,
          highSeat: skyboxData.highSeat,
          taxedCost: skyboxData.totalCost,
          quantity: skyboxData.qty,
          stockType: skyboxData.stockType,
          seatType: (skyboxData.highSeat - skyboxData.lowSeat + 1) === skyboxData.qty ? "CONSECUTIVE" : "ALTERNATING",
          splitType: "DEFAULT",
          customSplit: undefined,
          notes: skyboxData.externalRef,
          publicNotes: skyboxData.publicNotes,
          tags: skyboxData.inventoryTag,
          zoneSeating: false,
          listPrice: 0,
          inHandDate: skyboxData.inHandDate.toISOString().split('T')[0],
          hideSeatNumbers: true,
          broadcast: skyboxData.broadcast,
          tickets: skyboxData.tickets.map((t) => ({
            row: t.row,
            seatNumber: t.seat,
            status: t.status,
          })),
        },
      },
    ],
  };

  axios.post(url, data, { headers })
    .then(response => {
      console.log('Response data:', response.data);
      console.log( response.data.id)
      let result = response.data.id
      return result
    })
    .catch(error => {
      console.error('Error making POST request:', error.response.data);
    });
}

module.exports = { createPurchase };
