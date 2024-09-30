# Fleet Management System

This is a fleet management system for real-time vehicle telemetry, including analytics such as average speed, distance, fuel consumption, mileage, and accident detection based on sudden speed decrease.

The system consists of a Kafka-based producer-consumer architecture, where:
- **Producer** generates and sends vehicle telemetry data (speed, fuel consumption, GPS location) to Kafka.
- **Consumer** listens for telemetry data from Kafka, processes it, and stores it in a MongoDB database while performing real-time analytics.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Running the Project](#running-the-project)
- [Producer API Endpoints](#producer-api-endpoints)
- [Consumer Analytics](#consumer-analytics)
- [Notes](#notes)

## Features

- Real-time telemetry data generation for vehicles (speed, location, fuel consumption).
- Real-time analytics, including average speed, distance traveled, fuel consumption, and accident detection.
- Kafka messaging for telemetry data transfer.
- MongoDB for NoSQL data storage.
- Express server for API endpoints.

## Technologies Used

- **Node.js**: Backend runtime for both the producer and consumer servers.
- **Kafka**: Distributed message broker for real-time vehicle telemetry data.
- **MongoDB**: NoSQL database for storing vehicle telemetry data.
- **Express.js**: Framework for building APIs.
- **Axios**: HTTP client for sending POST requests.
  
## Installation

### 1. Prerequisites

- **Node.js**: Ensure Node.js is installed. You can download it from [here](https://nodejs.org/).
- **MongoDB**: Ensure MongoDB is installed and running locally. You can download MongoDB from [here](https://www.mongodb.com/try/download/community).
- **Kafka**: Install Kafka and Zookeeper. Kafka requires Zookeeper to run.

#### Kafka Installation

1. Download Kafka from the official website: [Kafka Downloads](https://kafka.apache.org/downloads)
2. Extract the downloaded Kafka files.
3. Start Zookeeper:
   ```bash
   zookeeper-server-start.sh /path/to/kafka/config/zookeeper.properties
   ```
4. Start Kafka:
   ```
   kafka-server-start.sh /path/to/kafka/config/server.properties
   ```
5. MongoDB Installation
Install MongoDB from the MongoDB Community Edition download page.
Start MongoDB:
   ```
   mongod --dbpath /path/to/your/db
   ```
6. Clone the Repository
Clone this repository to your local machine:

   ```
   git clone https://github.com/your-username/fleet-management-system.git
   cd fleet-management-system
   ```
7. Install Dependencies
Install the required Node.js dependencies for both the producer and consumer:
   ```
   npm install
   ```
   The following dependencies will be installed:

   - express
   - kafka-node
   - mongoose
   - axios
   - body-parser

8. Create Kafka Topics
Create a topic for vehicle telemetry in Kafka. Run the following command in the Kafka directory:
   ```
   kafka-topics.sh --create --topic vehicle-telemetry --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1
   ```
This creates a topic called vehicle-telemetry where the producer will send telemetry data.

Running the Project
1. Start Kafka and Zookeeper
Make sure Zookeeper and Kafka are running:

# Start Zookeeper
```
zookeeper-server-start.sh /path/to/zookeeper/config/zookeeper.properties
```
# Start Kafka
```
kafka-server-start.sh /path/to/kafka/config/server.properties
```
2. Start MongoDB
Start MongoDB on your local machine:
```
mongod --dbpath /path/to/your/db
```
3. Start the Producer
The Kafka producer is responsible for sending simulated telemetry data to Kafka. To start the producer:

```
node producer.js
```
The producer will start listening on http://localhost:3000.

4. Start the Consumer
The consumer listens for telemetry data from Kafka, saves it to MongoDB, and performs real-time analytics. To start the consumer:
```
node consumer.js
```
The consumer will start listening on http://localhost:3002.

5. Trigger Data Generation
You can trigger the producer to start sending data by making a POST request to the /send-telemetry endpoint. The consumer will automatically send this request when it starts.

Producer API Endpoints
1. POST /send-telemetry
This endpoint triggers the producer to send vehicle telemetry data for 1 minute. The telemetry data includes:

vehicleId: The ID of the vehicle.
speed: The speed of the vehicle.
distance: Distance traveled.
fuelConsumption: Amount of fuel consumed.
location: GPS coordinates (latitude and longitude).
Example request:

curl -X POST http://localhost:3000/send-telemetry -H "Content-Type: application/json" -d '{
  "vehicleId": "Vehicle_1",
  "speed": 65,
  "distance": 10,
  "fuelConsumption": 1.2,
  "latitude": 37.7749,
  "longitude": -122.4194
}'
Consumer Analytics
The consumer processes incoming telemetry data and calculates real-time analytics, including:

Average Speed: The average speed of each vehicle.

Total Distance Traveled: The total distance traveled by each vehicle.

Fuel Consumption: The total fuel consumption.

Accident Detection: If the speed drops from above 60 to 0 instantly, an accident is flagged.

### Notes
Ensure MongoDB and Kafka are running before starting the producer and consumer.
The producer will send telemetry data for 1 minute after the consumer triggers it.
The MongoDB instance stores all the telemetry data, and you can query it directly for further analysis.
License
This project is licensed under the MIT License. See the 

LICENSE file for details.
