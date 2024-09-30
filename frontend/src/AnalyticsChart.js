import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AnalyticsChart.css'; 
import { Chart } from "react-google-charts";
import { Progress } from 'antd';  // Import Ant Design Progress
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';  // Leaflet components
import 'leaflet/dist/leaflet.css'; // Leaflet CSS
import L from 'leaflet'; // For setting the custom icon

// Define the car icon (You can replace this URL with any car image or a local one)
const carIcon = new L.Icon({
  iconUrl: 'https://img.icons8.com/ios-filled/50/000000/car--v1.png', // Replace with your car icon URL
  iconSize: [32, 32], // size of the icon
  iconAnchor: [16, 32], // point of the icon which will correspond to marker's location
  popupAnchor: [0, -32] // point from which the popup should open relative to the iconAnchor
});

const AnalyticsChart = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [vehicleId, setVehicleId] = useState(1); // Start with vehicle ID 1

  // Fetch analytics data based on selected vehicle ID
  const fetchAnalytics = async (vehicleId) => {
    try {
      const response = await axios.get(`https://kafka-consumer-830340334999.us-central1.run.app/analytics/${vehicleId}`);
      setAnalyticsData(response.data);
      console.log(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  useEffect(() => {
    fetchAnalytics(vehicleId);
  }, [vehicleId]);

  // Prepare the data for Google Charts (Time vs Speed)
  const timeVsSpeedData = [
    ["Day", "Speed (km/h)"], // Headers for Google Charts
    ...(analyticsData ? analyticsData.timestamps.map((timestamp, index) => {
      // Convert timestamp to date and format as dd
      const date = new Date(timestamp);
      const formattedDay = String(date.getDate()).padStart(2, '0');
      return [formattedDay, analyticsData.speeds[index]];
    }) : [])
  ];

  // Options for Google Line Chart
  const lineChartOptions = {
    hAxis: {
      title: "Day",
      format: 'dd',  // Only display day on x-axis
    },
    vAxis: {
      title: "Speed (km/h)"
    },
    curveType: 'function',  // Makes the line chart smooth
    legend: { position: "bottom" },
  };

  // Calculate fuel percentage and remaining fuel in liters
  const tankCapacity = 50; // liters
  const fuelUsed = analyticsData ? analyticsData.lastFuelLevel : 0; // Assuming lastFuelLevel is the fuel used
  const fuelPercentage = ((((100 - fuelUsed) * tankCapacity) / tankCapacity) * 100).toFixed(2); // Percentage of fuel used
  
  // Calculate distance percentage
  const distancePercentage = analyticsData ? (analyticsData.totalDistance / 100) * 100 : 0; // Assuming 100km max distance for ring progress

  // Handle button click for vehicle ID
  const handleVehicleClick = (id) => {
    setVehicleId(id); // Set the clicked vehicle ID and fetch the corresponding data
  };

  // Set default latitude and longitude to some initial location
  const defaultLocation = [26.46634828,73.11541134]; // Default coordinates in case there's no data
  
  // Get the last known location from analytics data or use fallback default values
  const lastLocation = (analyticsData && analyticsData.lastCoordinates)
    ? [analyticsData.lastCoordinates.latitude, analyticsData.lastCoordinates.longitude]
    : defaultLocation;

  return (
    <div className="analytics-container">
      <h3>Analytics for Vehicle {vehicleId}</h3>
      
      {/* Buttons for vehicle selection */}
      <div className="vehicle-buttons">
        {[1, 2, 3, 4, 5].map(id => (
          <button 
            key={id} 
            onClick={() => handleVehicleClick(id)}
            className={`vehicle-button ${vehicleId === id ? 'active' : ''}`} // Add active class if the vehicle is selected
          >
            Vehicle {id}
          </button>
        ))}
      </div>

      {/* Main layout with 60/40 split */}
      <div className="main-layout">
        
        {/* 60% - Speed vs Time Line Chart */}
        <div className="chart-section">
          <h4>Speed over Time</h4>
          {analyticsData && (
            <Chart
              chartType="LineChart"
              width="100%"
              height="400px"
              data={timeVsSpeedData}
              options={lineChartOptions}
            />
          )}
        </div>

        {/* 40% - Progress Circles for Fuel and Distance */}
        <div className="progress-section">
          {/* Fuel Consumption Progress Circle */}
          <div className="progress-circle">
            <h4>Fuel Consumed</h4>
            <Progress
              type="circle"
              percent={fuelPercentage}
              format={percent => `${parseFloat(percent).toFixed(2)}%`}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
            <p>Fuel Used: {fuelPercentage} liters</p> {/* Display fuel used in liters */}
          </div>

          {/* Total Distance Traveled Progress Circle */}
          <div className="progress-circle">
            <h4>Total Distance Traveled</h4>
            <Progress
              type="circle"
              percent={distancePercentage}
              format={percent => `${Math.round((percent / 100) * 100)} km`} // Display distance as km
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
          </div>
        </div>
      </div>

      {/* Map Section (below the 60/40 layout) */}
      <div className="map-container">
        <h4>Vehicle Last Known Location</h4>
        <MapContainer center={lastLocation} zoom={15} scrollWheelZoom={true} style={{ height: "400px", width: "100%" }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
          />
          <Marker position={lastLocation} icon={carIcon}>
            <Popup>
              Vehicle {vehicleId}'s last known location.
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
};

export default AnalyticsChart;
