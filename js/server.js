const express = require('express');
const bodyParser = require('body-parser');
const { sendNotification } = require('./notificationBot');

const app = express();
app.use(bodyParser.json());

let clientReady = false;

app.post('/send-notification', (req, res) => {
    if (clientReady) {
        const { to, message } = req.body;
        sendNotification(to, message);
        res.status(200).send('Notification sent');
    } else {
        res.status(503).send('Client not ready');
    }
});

app.post('/ready', (req, res) => {
    clientReady = true;
    res.status(200).send('Client is ready');
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
