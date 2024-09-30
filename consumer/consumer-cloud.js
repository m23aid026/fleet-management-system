const express = require('express')
const { Kafka } = require('kafkajs');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require("dotenv");
dotenv.config({ path: `.env.cloud` });

// Measure the startup time
const startTime = process.hrtime();
// Enable CORS for all routes
const app = express();
app.use(cors());
const port = 3002;

const kafkaClient = new Kafka({
    brokers: [process.env.KAFKA_HOST],
    ssl: true,
    sasl: {
        mechanism: 'plain',
        username: process.env.KAFKA_API_KEY,
        password: process.env.KAFKA_PASSWORD
    }
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch((err) => console.error('Failed to connect to MongoDB Atlas', err));

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
}, { collection: process.env.MONGO_COLLECTION });

const Telemetry = mongoose.model('telemetry', TelemetrySchema);

const consumer = kafkaClient.consumer({ groupId: 'vehicle-group' });

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
            vehicleId
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
            lastLatitude = data.location.latitude;
            lastLongitude = data.location.longitude;
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

// Get last vehicle locations
app.get('/analytics/locations', async (req, res) => {
    try {
        // Step 1: Find all the vehicles and sort by timestamp in descending order
        const lastLocations = await Telemetry.find({})
            .sort({ timestamp: -1 }) // Sort by timestamp descending
            .exec();

        // Step 2: Create an object to store the latest location for each vehicle
        const vehicleLatestLocations = {};

        // Step 3: Loop through the sorted results and keep only the latest for each vehicle
        lastLocations.forEach(location => {
            if (!vehicleLatestLocations[location.vehicleId]) {
                vehicleLatestLocations[location.vehicleId] = {
                    vehicleId: location.vehicleId,
                    location: location.location,
                    speed: location.speed,
                    timestamp: location.timestamp
                };
            }
        });

        // Convert the object values back into an array
        const result = Object.values(vehicleLatestLocations);

        // Step 4: Send the result
        if (result.length === 0) {
            return res.status(404).send({ message: 'No locations found' });
        }

        console.log('Last Locations', result);
        res.send(result);
    } catch (error) {
        console.error('Error fetching last locations:', error);
        res.status(500).send({ error: 'Failed to fetch locations' });
    }
});

// Real-time analytics function
async function calculateAnalytics(vehicleId) {
    const stats = await Telemetry.aggregate([
        { $match: { vehicleId } },
        {
            $group: {
                _id: '$vehicleId',
                averageSpeed: { $avg: '$speed' },
                totalDistance: { $sum: '$distance' },
                totalFuelConsumption: { $sum: '$fuelConsumption' },
                lastLocation: { $last: '$location' },
                lastSpeed: { $last: '$speed' },
            }
        },
    ]);
    return stats[0];  // Return first (and only) group result
}

const startConsuming = async () => {
    await consumer.connect();
    console.log('consumer ready to consume');

    await consumer.subscribe({ topic: process.env.KAFKA_TOPIC, fromBeginning: true });
    try {
        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const telemetryData = new Telemetry(JSON.parse(message.value));


                await telemetryData.save();
                console.log('message saved');

                // Accident analysis (sudden stop or speed drop)
                analyzeSpeedForAccident(telemetryData);
            }
        });
    } catch (error) {
        console.error('Error saving message to MongoDB:', error);
    }
}

startConsuming().catch((err) => {
    console.error('Error running Kafka consumer:', err);
});

// Start server
app.listen(port, () => {
    // Calculate and log startup time
    const endTime = process.hrtime(startTime);
    const seconds = endTime[0]; // seconds
    const milliseconds = Math.round(endTime[1] / 1e6); // convert nanoseconds to milliseconds

    console.log(`Server running on http://localhost:${port}`);
    console.log(`Application started in ${seconds} seconds and ${milliseconds} milliseconds.`);
});