const express = require('express');
const { KafkaClient, Consumer } = require('kafka-node');
const mongoose = require('mongoose');
const axios = require('axios');

// MongoDB Schema and Model
mongoose.connect('mongodb://localhost:27017/vehicle-data')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Failed to connect to MongoDB', err));

const TelemetrySchema = new mongoose.Schema({
  vehicleId: String,
  speed: Number,
  distance: Number,
  fuelConsumption: Number,
  location: {
    latitude: Number,
    longitude: Number,
  },
  timestamp: Date,
});

const Telemetry = mongoose.model('Telemetry', TelemetrySchema);

// Kafka Consumer setup
const client = new KafkaClient({ kafkaHost: 'localhost:9092' });
const consumer = new Consumer(
  client,
  [{ topic: 'vehicle-telemetry', partition: 0 }],
  { autoCommit: true }
);

// Function to send a POST request to the producer to start the process
async function startProducer() {
  try {
    const response = await axios.post('http://localhost:3001/send-telemetry', {
      vehicleId: 'Vehicle_2',
      speed: 65,
      distance: 10,
      fuelConsumption: 1.2,
      latitude: 37.7749, // Sample latitude
      longitude: -122.4194, // Sample longitude
    });
    console.log('Producer started:', response.data);
  } catch (error) {
    console.error('Error starting producer:', error);
  }
}

// Real-time analytics function
async function calculateAnalytics(vehicleId) {
  const stats = await Telemetry.aggregate([
    { $match: { vehicleId } },
    { $group: {
      _id: '$vehicleId',
      averageSpeed: { $avg: '$speed' },
      totalDistance: { $sum: '$distance' },
      totalFuelConsumption: { $sum: '$fuelConsumption' },
      lastLocation: { $last: '$location' },
      lastSpeed: { $last: '$speed' },
    }},
  ]);
  return stats[0];  // Return first (and only) group result
}

// Event listener for Kafka messages
consumer.on('message', async (message) => {
  const telemetryData = JSON.parse(message.value);

  // Save telemetry data to MongoDB
  const telemetry = new Telemetry(telemetryData);
  await telemetry.save();

  // Real-time analytics calculation
  const vehicleId = telemetryData.vehicleId;
  const vehicleStats = await calculateAnalytics(vehicleId);
  
  console.log(`Analytics for vehicle ${vehicleId}:`, vehicleStats);

  // Accident detection (speed drop from >60 to 0)
  if (vehicleStats.lastSpeed > 60 && telemetryData.speed === 0) {
    console.log(`Accident possibility detected for vehicle ${vehicleId} at location:`, telemetryData.location);
  }
});

// Event listener for Kafka consumer error
consumer.on('error', (err) => {
  console.error('Kafka Consumer error:', err);
});

// Express app to listen for requests (optional, for potential API endpoints)
const app = express();
const port = 3002;

app.listen(port, async () => {
  console.log(`Server running on http://localhost:${port}`);

  // Send a POST request to the producer to start sending data
  await startProducer();
});
