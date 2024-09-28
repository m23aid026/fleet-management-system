const express = require('express');
const kafka = require('kafka-node');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Kafka Producer setup
const client = new kafka.KafkaClient({ kafkaHost: 'localhost:9092' });
const producer = new kafka.Producer(client);

// Function to send data to Kafka topic
function sendTelemetryData(telemetryData) {
  const payloads = [
    { topic: 'vehicle-telemetry', messages: JSON.stringify(telemetryData), partition: 0 }
  ];

  producer.send(payloads, (err, data) => {
    if (err) {
      console.error('Failed to send data:', err);
    } else {
      console.log('Data sent:', data);
    }
  });
}

// Start sending telemetry data for 1 minute
app.post('/send-telemetry', (req, res) => {
  const telemetryDataTemplate = req.body;
  const interval = 1000; // send data every 2 seconds
  const duration = 60000; // 1 minute (60000 milliseconds)
  
  console.log('Starting to send telemetry data...');

  // Set an interval to send data every 2 seconds
  const dataInterval = setInterval(() => {
    const currentTimestamp = new Date();

    // Simulating updated telemetry data for each interval
    const updatedTelemetryData = {
      ...telemetryDataTemplate,
      speed: Math.random() * 100, // Simulating random speed
      distance: Math.random() * 10, // Random distance traveled
      fuelConsumption: Math.random() * 2, // Random fuel consumption
      location: {
        latitude: telemetryDataTemplate.latitude + Math.random() * 0.01,
        longitude: telemetryDataTemplate.longitude + Math.random() * 0.01,
      },
      timestamp: currentTimestamp
    };

    sendTelemetryData(updatedTelemetryData);

  }, interval);

  // Stop sending data after 1 minute
  setTimeout(() => {
    clearInterval(dataInterval);
    console.log('Stopped sending telemetry data after 1 minute.');
  }, duration);

  res.status(200).send('Started sending telemetry data for 1 minute.');
});

// Ensure producer is ready before starting to send data
producer.on('ready', () => {
  console.log('Kafka Producer is connected and ready.');
});

producer.on('error', (err) => {
  console.error('Producer error:', err);
});

const port = 3001;
app.listen(port, () => {
  console.log(`Producer server is running on http://localhost:${port}`);
});
