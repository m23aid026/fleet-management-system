const { Kafka } = require('kafkajs');
const fleet_1 = require('./fleet-data/fleet1.json');
const fleet_2 = require('./fleet-data/fleet2.json');
const dotenv = require("dotenv");
dotenv.config({ path: `.env.cloud` });
// const express = require('express');
// const bodyParser = require('body-parser');
// const app = express();
// app.use(bodyParser.json());

// Kafka Producer setup
const KafkaClient = new Kafka({
    brokers: [process.env.KAFKA_HOST],
    ssl: true,
    sasl: {
        mechanism: 'plain',
        username: process.env.KAFKA_API_KEY,
        password: process.env.KAFKA_PASSWORD
    }
});
const producer = KafkaClient.producer();

// Function to send data to Kafka topic
function sendTelemetryData(telemetryDataFleet) {
    // console.log(process.env.KAFKA_HOST);
    producer.send({
        topic: process.env.KAFKA_TOPIC,
        messages: [
            { value: JSON.stringify(telemetryDataFleet[0]), partition: 0}, 
            { value: JSON.stringify(telemetryDataFleet[1]), partition: 0}, 
            { value: JSON.stringify(telemetryDataFleet[2]), partition: 1},
            { value: JSON.stringify(telemetryDataFleet[3]), partition: 1}
        ]
    }, (err, data) => {
        if (err) {
            console.error('Failed to send data:', err);
        } else {
            console.log('Data sent:', data);
        }
    });
}

function generateFleetData(fleet, i, reverse = false) {

    const currentTimestamp = new Date();
    let vehicleId = fleet[i].fleetNo;
    const distanceTravelled = Math.random() * 10;
    const fuelLevel = Math.random() * 2;
    const latitude = fleet[i].lat;
    const longitude = fleet[i].long;
    const speed = fleet[i].speed;
    const timestamp = currentTimestamp;

    if (reverse && vehicleId == '1') vehicleId = "3";
    else if (reverse && vehicleId == '2') vehicleId = "4";
    return {
        vehicleId,
        distanceTravelled,
        location: { latitude, longitude },
        speed,
        timestamp,
        fuelLevel
    };
}
// Start sending telemetry data for 1 minute
const prepareTelemetryData = async () => {
    await producer.connect();
    //   const telemetryDataTemplate = req.body;
    const interval = 1000; // send data every 1 seconds
    const duration = 60000; // for 1 minute (60000 milliseconds)

    console.log('Starting to send telemetry data...');
    let index_1 = 0;
    let index_2 = fleet_1.length - 1;
    console.log("index 2::" + index_2);
    // Set an interval to send data every 2 seconds
    const dataInterval = setInterval(() => {
        // Simulating updated telemetry data for each interval
        let telemetryDataFleet = [];
        telemetryDataFleet.push(
            generateFleetData(fleet_1, index_1),
            generateFleetData(fleet_2, index_1),
            generateFleetData(fleet_1, index_2, true),
            generateFleetData(fleet_2, index_2, true)
        );
        index_1 += 1;
        index_2 -= 1;

        if (index_1 == fleet_1.length) index_1 = 0;
        if (index_2 == 0) index_2 = fleet_1.length - 1;

        sendTelemetryData(telemetryDataFleet);
    }, interval);

    // Stop sending data after 1 minute
    setTimeout(() => {
        clearInterval(dataInterval);
        console.log('Stopped sending telemetry data after 1 minute.');
    }, duration);
}

// Ensure producer is ready before starting to send data
producer.on(producer.events.CONNECT, () => {
    console.log('Kafka Producer is connected and ready.');
});

// producer.on('error', (err) => {
//     console.error('Producer error:', err);
// });

prepareTelemetryData().catch(console.error);

// const port = 3001;
// app.listen(port, () => {
//   console.log(`Producer server is running on http://localhost:${port}`);
// });
