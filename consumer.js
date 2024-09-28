const express = require('express');
const cors = require('cors');  // Add this line
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

// Enable CORS for all routes
const app = express();
app.use(cors());  // Add this line

const port = 3002;

// API endpoint to get analytics data for X days
app.get('/analytics/:vehicleId', async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const days = parseInt(req.query.days) || 7;  // Default to 7 days if not specified
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);  // X days before today

    // Find telemetry data within the specified time range
    const telemetryData = await Telemetry.find({
      vehicleId,
      timestamp: { $gte: startDate, $lte: endDate }
    }).sort({ timestamp: 1 }); // Sort by timestamp

    if (!telemetryData.length) {
      return res.status(404).send({ message: 'No data found for the specified vehicle and date range' });
    }

    // Calculate total statistics
    const analytics = await Telemetry.aggregate([
      { $match: { vehicleId, timestamp: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: '$vehicleId',
          averageSpeed: { $avg: '$speed' },
          totalDistance: { $sum: '$distance' },
          totalFuelConsumption: { $sum: '$fuelConsumption' },
        }
      }
    ]);

    // Extract timestamps and speeds for time vs speed graph
    const timestamps = telemetryData.map(data => data.timestamp);
    const speeds = telemetryData.map(data => data.speed);

    // Respond with both the aggregated statistics and time vs speed data
    res.send({
      ...analytics[0],  // Aggregated statistics
      timestamps,       // Timestamps for time vs speed chart
      speeds,           // Speed values for time vs speed chart
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).send({ error: 'Failed to fetch analytics' });
  }
});

app.listen(port, async () => {
  console.log(`Server running on http://localhost:${port}`);
});
