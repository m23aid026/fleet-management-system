// src/TelemetryComponent.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TelemetryComponent = () => {
  const [telemetryData, setTelemetryData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch telemetry data from the backend API
    const fetchTelemetryData = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/telemetry');
        setTelemetryData(response.data);
      } catch (err) {
        setError('Error fetching telemetry data');
      }
    };

    fetchTelemetryData();
  }, []); // Empty dependency array ensures this only runs once when the component mounts

  if (error) {
    return <div>{error}</div>;
  }

  if (telemetryData.length === 0) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Vehicle Telemetry Data</h1>
      {telemetryData.map((data, index) => (
        <div key={index}>
          <p><strong>Device ID:</strong> {data.deviceId}</p>
          <p><strong>Timestamp:</strong> {data.timestamp}</p>
          <p><strong>Value:</strong> {data.value}</p>
          <p><strong>Variable:</strong> {data.variable}</p>
          <p><strong>Alarm Class:</strong> {data.alarmClass}</p>
          <hr />
        </div>
      ))}
    </div>
  );
};

export default TelemetryComponent;
