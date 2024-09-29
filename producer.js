const express = require('express');
const kafka = require('kafka-node');
const fs = require('fs');
const csv = require('csv-parser');
const haversine = require('haversine-distance');  // For calculating distance between two points

const app = express();

// Kafka Producer setup
const client = new kafka.KafkaClient({ kafkaHost: 'localhost:9092' });
const producer = new kafka.Producer(client);

// Array to store CSV data
let csvData = [];

// Read CSV data into memory
fs.createReadStream('vehicle_data.csv')
  .pipe(csv())
  .on('data', (row) => {
    csvData.push({
      latitude: parseFloat(row.lat),
      longitude: parseFloat(row.long),
    });
  })
  .on('end', () => {
    console.log('CSV file successfully processed');
  });

// Function to calculate distance between two coordinates (in kilometers)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const point1 = { lat: lat1, lon: lon1 };
  const point2 = { lat: lat2, lon: lon2 };
  return haversine(point1, point2) / 1000;  // Return distance in kilometers
}

// Function to simulate fuel consumption (fuel decreases with distance and speed)
function calculateFuelConsumption(previousFuelLevel, speed, distance) {
  const fuelConsumptionRate = 0.1;  // Base consumption rate (liters/km)
  const speedFactor = speed / 100;  // More speed, more consumption
  const fuelConsumed = distance * fuelConsumptionRate * speedFactor;
  return Math.max(0, previousFuelLevel - fuelConsumed);  // Ensure fuel doesn't go below 0
}

// Function to generate random speed, sometimes stop
function generateRandomSpeed(currentSpeed, isStopped) {
  if (isStopped) return 0;  // If the vehicle is stopped, return 0 speed

  return Math.random() < 0.1 ? 0 : Math.random() * 80 + 20;  // Random speed 20-100, occasionally 0 (stop)
}

// Function to send data to Kafka topic
function sendTelemetryData(vehicleId, telemetryData) {
  const payloads = [
    { topic: 'vehicle-telemetry', messages: JSON.stringify({ vehicleId, ...telemetryData }), partition: 0 }
  ];

  producer.send(payloads, (err, data) => {
    if (err) {
      console.error('Failed to send data:', err);
    } else {
      console.log(`Data sent for Vehicle ${vehicleId}:`, data);
    }
  });
}

// Function to simulate telemetry data for each vehicle
function startSendingTelemetryDataForVehicles(vehicleCount) {
  const interval = 2000;  // Send data every 2 seconds
  let vehicleDataIndex = 0;

  // Initialize data for each vehicle with speed starting from 0
  const vehicleStates = Array.from({ length: vehicleCount }, (_, vehicleId) => ({
    previousLatitude: csvData[0].latitude,
    previousLongitude: csvData[0].longitude,
    distanceTravelled: 0,
    fuelLevel: 100,  // Start with a full tank (100 liters)
    vehicleId: vehicleId + 1,
    speed: 0,  // Start with 0 speed
    isStopped: false,  // Initially not stopped
    stopDuration: 0,  // Counter to manage stop duration
  }));

  // Loop through vehicle count
  setInterval(() => {
    vehicleStates.forEach(vehicleState => {
      if (vehicleDataIndex >= csvData.length) {
        vehicleDataIndex = 0;  // Reset to start after reaching end of CSV data
      }

      const currentData = csvData[vehicleDataIndex];
      const distance = calculateDistance(
        vehicleState.previousLatitude, vehicleState.previousLongitude,
        currentData.latitude, currentData.longitude
      );

      // Handle stopping logic
      if (vehicleState.isStopped) {
        vehicleState.stopDuration++;

        if (vehicleState.stopDuration >= 5) {  // Resume after 5 intervals (10 seconds)
          vehicleState.isStopped = false;
          vehicleState.stopDuration = 0;
        }
      } else {
        // Randomly decide to stop the vehicle
        if (Math.random() < 0.1) {
          vehicleState.isStopped = true;
        }
      }

      // Generate random speed and fuel level after some intervals, but ensure it starts from 0
      if (vehicleState.speed === 0 && !vehicleState.isStopped) {
        vehicleState.speed = generateRandomSpeed(vehicleState.speed, vehicleState.isStopped);
      } else if (!vehicleState.isStopped) {
        vehicleState.speed = generateRandomSpeed(vehicleState.speed, vehicleState.isStopped);
      }
      
      vehicleState.distanceTravelled += distance;
      vehicleState.fuelLevel = calculateFuelConsumption(vehicleState.fuelLevel, vehicleState.speed, distance);

      const telemetryData = {
        latitude: currentData.latitude,
        longitude: currentData.longitude,
        speed: vehicleState.speed,
        distanceTravelled: vehicleState.distanceTravelled,
        fuelLevel: vehicleState.fuelLevel,
        timestamp: new Date()
      };

      // Send telemetry data for the vehicle
      sendTelemetryData(vehicleState.vehicleId, telemetryData);

      // Update the previous position for the next iteration
      vehicleState.previousLatitude = currentData.latitude;
      vehicleState.previousLongitude = currentData.longitude;
    });

    vehicleDataIndex++;
  }, interval);
}

// Ensure producer is ready before starting to send data
producer.on('ready', () => {
  console.log('Kafka Producer is connected and ready.');

  const vehicleCount = 5;  // Set how many vehicles you want to simulate
  startSendingTelemetryDataForVehicles(vehicleCount);  // Start sending data immediately
});

producer.on('error', (err) => {
  console.error('Producer error:', err);
});

// Start server
const port = 3001;
app.listen(port, () => {
  console.log(`Producer server is running on http://localhost:${port}`);
});
