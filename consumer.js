const express = require('express');
const cors = require('cors');
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
  distanceTravelled: Number,
  fuelLevel: Number,
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

// Enable CORS for all routes
const app = express();
app.use(cors());

const port = 3002;

// Function to send notifications (accident analysis)
async function sendNotification(vehicleId, message) {
  try {
    // Example notification service (modify to integrate with your system)
    // await axios.post('http://localhost:3003/notify', { vehicleId, message });
    console.log(`Notification sent for Vehicle ${vehicleId}: ${message}`);
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}

// Function for accident analysis (sudden speed drops and speed = 0)
function analyzeSpeedForAccident(telemetryData) {
  if (telemetryData.speed === 0) {
    sendNotification(telemetryData.vehicleId, 'Vehicle stopped, possible accident detected.');
  }
}

// API to get today's statistics
app.get('/analytics/:vehicleId', async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Midnight of the current day

    // Find telemetry data from today
    const telemetryData = await Telemetry.find({
      vehicleId,
      timestamp: { $gte: today }
    }).sort({ timestamp: 1 });

    if (!telemetryData.length) {
      return res.status(404).send({ message: 'No data found for the vehicle today' });
    }

    // Calculate total distance, mileage, and extract speed, latitude, longitude, timestamps
    let totalDistance = 0;
    let fuelStart, fuelEnd;
    const speeds = []; // To store speed data
    const timestamps = []; // To store timestamp data
    let lastLatitude = null;
    let lastLongitude = null;

    telemetryData.forEach((data, index) => {
      totalDistance += data.distanceTravelled;
      speeds.push(data.speed); // Collect speed data
      timestamps.push(data.timestamp); // Collect timestamp data

      if (index === 0) fuelStart = data.fuelLevel; // First record of the day
      fuelEnd = data.fuelLevel; // Last record of the day
      
      // Update last latitude and longitude
      lastLatitude = data.latitude;
      lastLongitude = data.longitude;
    });

    const fuelConsumed = fuelStart - fuelEnd;
    const mileage = fuelConsumed > 0 ? totalDistance / fuelConsumed : 0;

    // Get last fuel meter value
    const lastFuelLevel = telemetryData[telemetryData.length - 1].fuelLevel;

    // Respond with total distance, mileage, last fuel level, speeds, timestamps, and last coordinates
    res.send({
      totalDistance,
      mileage,
      lastFuelLevel,
      speeds, // Include speed data in the response
      timestamps, // Include timestamps for speed data
      lastCoordinates: {
        latitude: lastLatitude,
        longitude: lastLongitude
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).send({ error: 'Failed to fetch analytics' });
  }
});



// Kafka message processing
consumer.on('message', async (message) => {
  try {
    const telemetryData = JSON.parse(message.value);

    // Save telemetry data to MongoDB
    const newTelemetry = new Telemetry({
      vehicleId: telemetryData.vehicleId,
      speed: telemetryData.speed,
      distanceTravelled: telemetryData.distanceTravelled || 0,
      fuelLevel: telemetryData.fuelLevel || 0,
      location: {
        latitude:telemetryData.latitude,
        longitude:telemetryData.longitude
      },
      timestamp: telemetryData.timestamp
    });

    await newTelemetry.save();

    // Accident analysis (sudden stop or speed drop)
    analyzeSpeedForAccident(telemetryData);

  } catch (error) {
    console.error('Error processing message:', error);
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
