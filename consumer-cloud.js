const { Kafka } = require('kafkajs');
const mongoose = require('mongoose');
const dotenv = require("dotenv");
dotenv.config({ path: `.env.cloud` });

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
    distance: Number,
    fuelConsumption: Number,
    location: {
        latitude: Number,
        longitude: Number,
    },
    timestamp: Date,
}, { collection: process.env.MONGO_COLLECTION });

const Telemetry = mongoose.model(process.env.MONGO_COLLECTION, TelemetrySchema);

const consumer = kafkaClient.consumer({ groupId: 'vehicle-group' });

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

                const vehicleStats = await calculateAnalytics(telemetryData.vehicleId);
                console.log(`Analytics for vehicle ${telemetryData.vehicleId}:`, vehicleStats);

                // Accident detection (speed drop from >60 to 0)
                if (vehicleStats.lastSpeed > 60 && telemetryData.speed === 0) {
                    console.log(`Accident possibility detected for vehicle ${telemetryData.vehicleId} at location:`, telemetryData.location);
                }

            }
        });
    } catch (error) {
        console.error('Error saving message to MongoDB:', error);
    }
}

startConsuming().catch((err) => {
    console.error('Error running Kafka consumer:', err);
});