// Load environment variables from .env (development only)
require('dotenv').config();

// Import required modules
const express = require('express');  // Express framework
const amqp = require('amqplib/callback_api');  // RabbitMQ client
const cors = require('cors');  // CORS middleware

const app = express();
app.use(express.json());
app.use(cors());

// ✅ RabbitMQ connection string from environment (NOT hardcoded)
const RABBITMQ_URL = process.env.RABBITMQ_CONNECTION_STRING;

// POST route for creating orders
app.post('/orders', (req, res) => {
  const order = req.body;

  amqp.connect(RABBITMQ_URL, (err, conn) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error connecting to RabbitMQ');
    }

    conn.createChannel((err, channel) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error creating channel');
      }

      const queue = 'order_queue';
      const msg = JSON.stringify(order);

      channel.assertQueue(queue, { durable: false });
      channel.sendToQueue(queue, Buffer.from(msg));

      console.log('Sent order to queue:', msg);
      res.send('Order received');
    });
  });
});

// ✅ Port from environment with fallback
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Order service is running on port ${PORT}`);
});
