const express = require('express');
const http = require('http');
const SocketIO = require('socket.io');
const cors = require('cors'); // Import the CORS middleware
const app = express();
const server = http.createServer(app);
const io = SocketIO(server);
const PORT = 5001;

app.use(express.json());

// Enable CORS for all routes and origins (you can restrict it if needed)
app.use(cors({
  origin: '*', // You can replace '*' with the specific URL of your frontend
  methods: ['GET', 'POST'], // Allowed methods
  allowedHeaders: ['Content-Type'], // Allowed headers
}));

// Mock telemetry data for real-time updates
let telemetryData = {
  deviceId: 'vehicle_001',
  timestamp: new Date().toISOString(),
  value: Math.floor(Math.random() * 100),
  variable: 'speed',
  alarmClass: 'normal'
};

// API route to serve telemetry data
app.get('/api/telemetry', (req, res) => {
  telemetryData = {
    deviceId: 'vehicle_001',
    timestamp: new Date().toISOString(),
    value: Math.floor(Math.random() * 100),
    variable: 'speed',
    alarmClass: 'normal'
  };
  res.json([telemetryData]);
});

// Function to update telemetry data with a new timestamp
const generateNewTelemetryData = () => {
  const currentTime = new Date().toISOString();
  telemetryData = {
    deviceId: 'vehicle_001',
    timestamp: currentTime,
    value: Math.floor(Math.random() * 100), // Simulate random speed value
    variable: 'speed',
    alarmClass: 'normal'
  };
};

// Send real-time updates using Socket.IO
io.on('connection', (socket) => {
  console.log('Client connected');
  
  // Send initial data on connection
  socket.emit('telemetry', telemetryData);

  // Simulate telemetry data updates every 5 seconds
  const intervalId = setInterval(() => {
    generateNewTelemetryData();
    socket.emit('telemetry', telemetryData);
  }, 5000);

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    clearInterval(intervalId); // Stop sending data when client disconnects
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
