import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AnalyticsChart.css'; 
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  TimeScale,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import 'chartjs-adapter-date-fns';  // Import date-fns adapter
import { Line } from 'react-chartjs-2';
import { Progress } from 'antd';  // Import Ant Design Progress

// Register the required components for Line chart
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  TimeScale,
  Title,
  Tooltip,
  Legend
);

const AnalyticsChart = ({ vehicleId }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [days, setDays] = useState(7);
  vehicleId = '5';

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`http://localhost:3002/analytics/${vehicleId}?days=${days}`);
      setAnalyticsData(response.data);
      console.log(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [days]);

  // Prepare the time vs speed data for Line Chart
  const timeVsSpeedData = {
    labels: analyticsData ? analyticsData.timestamps : [],
    datasets: [{
      label: 'Speed over Time',
      data: analyticsData ? analyticsData.speeds : [],
      borderColor: 'rgba(75, 192, 192, 1)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      fill: true,
      tension: 0.4
    }]
  };

  // Calculate fuel percentage and remaining fuel in liters
  const tankCapacity = 50; // liters
  const fuelUsed = analyticsData ? analyticsData.lastFuelLevel : 0; // Assuming lastFuelLevel is the fuel used
  const fuelPercentage = ((((100-fuelUsed)*tankCapacity)/tankCapacity) * 100).toFixed(2); // Percentage of fuel used
  
  // Calculate distance percentage
  const distancePercentage = analyticsData ? (analyticsData.totalDistance / 100) * 100 : 0; // Assuming 100km max distance for ring progress

  return (
    <div className="analytics-container">
      <h3>Analytics for Vehicle {vehicleId}</h3>
      
      <input
        type="number"
        value={days}
        onChange={(e) => setDays(e.target.value)}
        placeholder="Enter number of days"
        className="days-input"
      />
      
      {/* Time vs Speed Line Chart */}
      <div className="chart-container">
        <h4>Speed over Time</h4>
        {analyticsData && (
          <Line
            data={timeVsSpeedData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: {
                  type: 'time',
                  time: { unit: 'day' },
                  title: { display: true, text: 'Time' }
                },
                y: { title: { display: true, text: 'Speed (km/h)' } }
              }
            }}
          />
        )}
      </div>

      {/* Fuel Consumption Progress Circle */}
      <div className="chart-container">
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
      <div className="chart-container">
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
  );
};

export default AnalyticsChart;
