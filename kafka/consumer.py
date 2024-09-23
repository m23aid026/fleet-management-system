from kafka import KafkaConsumer
import json
from pymongo import MongoClient

# MongoDB Connection Setup
mongo_client = MongoClient('mongodb://localhost:27017/')
db = mongo_client['local']
collection = db['runtime']

# Kafka Consumer Setup
consumer = KafkaConsumer(
    'telemetry-data',
    bootstrap_servers='localhost:9092',
    auto_offset_reset='earliest',    # start from the earliest message
    enable_auto_commit=True,         # commit the message once it's read
    group_id='telemetry-group',
    value_deserializer=lambda x: json.loads(x.decode('utf-8'))  # Deserialize JSON
)

# Consume Kafka messages and insert them into MongoDB
for message in consumer:
    telemetry_data = message.value
    print(f"Received data: {telemetry_data}")
    
    # Insert telemetry data into MongoDB
    collection.insert_one(telemetry_data)
    print("Data inserted into MongoDB")

