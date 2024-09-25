// consumer.js

const { Kafka } = require('kafkajs');
const { MongoClient } = require('mongodb');

// Kafka configuration using your Confluent Cloud API key/secret
const kafka = new Kafka({
  clientId: 'abc-consumer',
  brokers: ['pkc-7prvp.centralindia.azure.confluent.cloud:9092'], // E.g., pkc-xyz.confluent.cloud:9092
  ssl: true,
  sasl: {
    mechanism: 'plain',
    username: 'MROO3DN223WW3PMQ',
    password: 'gWO9Q8neNAGc8p78HHq3wOMwVVQ/wpIfaiVJCDlRCtTbS5qE8f/9vj3GEwzag0HA',
  },
});

const consumer = kafka.consumer({ groupId: 'vehicle-group' });

// MongoDB connection string
const uri = 'mongodb+srv://devUser1:FleetManagement@fleetmanagementsystem.ijmlk.mongodb.net/';
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function connectToMongoDB() {
  await client.connect();
  console.log('Connected to MongoDB');
  return client.db('FleeManagement').collection('Speed');
}

async function consumeAndStoreData() {
  const collection = await connectToMongoDB();

  await consumer.connect();
  await consumer.subscribe({ topic: 'fms_topic_speed', fromBeginning: true });

  console.log('Consuming data from Kafka...');
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const carData = JSON.parse(message.value.toString());
      console.log(`Consumed data: ${JSON.stringify(carData)}`);

      // Store car data in MongoDB
      await collection.insertOne(carData);
      console.log(`Stored data for car: ${carData.carId}`);
    },
  });
}

consumeAndStoreData().catch(console.error);
