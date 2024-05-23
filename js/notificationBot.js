const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');

let clientReady = false;

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors'],
    },
    webVersionCache: { type: 'none' }
});

client.on('qr', (qr) => {
    console.log('QR code received, please scan:');
    qrcode.generate(qr, { small: true });
});

client.on('authenticated', () => {
    console.log('Client is authenticated!');
});

client.on('ready', async () => {
    console.log('Client is ready!');
    clientReady = true;
    try {
        await axios.post('http://localhost:3000/ready');
        console.log('Server notified that client is ready.');
    } catch (error) {
        console.error('Failed to notify server:', error);
    }
});

client.on('auth_failure', (msg) => {
    console.error('Authentication failure:', msg);
});

client.on('disconnected', (reason) => {
    console.log('Client was logged out', reason);
    clientReady = false;
});

client.on('error', (error) => {
    console.error('Client error:', error);
});

async function sendNotification(to, message) {
    if (clientReady) {
        try {
            const response = await client.sendMessage(to, message);
            console.log(`Message sent to ${to}: ${response.id.id}`);
        } catch (error) {
            console.error(`Failed to send message to ${to}:`, error);
        }
    } else {
        console.error(`Failed to send message to ${to}: Client not ready`);
    }
}

client.initialize();

module.exports = { sendNotification };
