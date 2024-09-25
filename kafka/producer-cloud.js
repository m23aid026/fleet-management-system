require("dotenv").config();
const { Kafka } = require('kafkajs');
const fleet_1 = require('./fleet-data/fleet1.json');
const fleet_2 = require('./fleet-data/fleet2.json');

const dataLen = fleet_1.length;
const dataLen2 = fleet_2.length;
// Kafka configuration using your Confluent Cloud API key/secret
const kafka = new Kafka({
  clientId: 'abc',
  brokers: ['pkc-7prvp.centralindia.azure.confluent.cloud:9092'], // E.g., pkc-xyz.confluent.cloud:9092
  ssl: true,
  sasl: {
    mechanism: 'plain',
    username: 'MROO3DN223WW3PMQ',
    password: 'gWO9Q8neNAGc8p78HHq3wOMwVVQ/wpIfaiVJCDlRCtTbS5qE8f/9vj3GEwzag0HA',
  },
});

const producer = kafka.producer();

// Dummy car data generation (simulated)
const generateFleetData = (fleet, i) => {
  const fleetNo = fleet[i].fleetNo;
  const lat = fleet[i].lat;
  const long = fleet[i].long;
  const speed = fleet[i].speed;
  const timestamp = new Date().toISOString();

  return {
    fleetNo,
    location: { lat, long },
    speed,
    timestamp,
  };
};

const sendFleetData = async () => {
  await producer.connect();
  let index = 0;
  console.log("data len : " + dataLen);
  console.log("data len : " + dataLen2);
  // Simulate fleet data every 3 seconds
  setInterval(async () => {
    console.log("index value : " + index);
    const fleet1 = generateFleetData(fleet_1, index);
    console.log(`Sending data: ${JSON.stringify(fleet1)}`);
    
    const fleet2 = generateFleetData(fleet_2, index);
    console.log(`Sending data: ${JSON.stringify(fleet2)}`);
    index = index + 1;
    if(index == dataLen) index = 0;
    await producer.send({
      topic: 'fms_topic_speed',
      messages: [{ key: fleet1.fleetNo, value: JSON.stringify(fleet1) }, { key: fleet2.fleetNo, value: JSON.stringify(fleet2) }],
    });
  }, 3000);
};

sendFleetData().catch(console.error);








