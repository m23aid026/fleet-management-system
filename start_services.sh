#!/bin/bash

# Start Zookeeper in a new terminal
gnome-terminal -- bash -c "cd kafka; ./bin/zookeeper-server-start.sh config/zookeeper.properties; exec bash"

# Start Kafka in a new terminal
gnome-terminal -- bash -c "cd kafka; ./bin/kafka-server-start.sh config/server.properties; exec bash"

# Start MongoDB service
sudo systemctl start mongod

# Start Node.js producer in a new terminal
gnome-terminal -- bash -c "node producer.js; exec bash"

# Start Node.js consumer in a new terminal
gnome-terminal -- bash -c "node consumer.js; exec bash"

# Start React frontend in a new terminal
gnome-terminal -- bash -c "cd frontend; npm start; exec bash"
