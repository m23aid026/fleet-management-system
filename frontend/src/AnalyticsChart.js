import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AnalyticsChart.css'; 
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  BarElement,
  PointElement,
  TimeScale,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import 'chartjs-adapter-date-fns';  // Import date-fns adapter
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register the required components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  TimeScale,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AnalyticsChart = ({ vehicleId }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [days, setDays] = useState(7);
  vehicleId='Vehicle_2';
  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`http://localhost:3002/analytics/${vehicleId}?days=${days}`);
      setAnalyticsData(response.data);
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
    }]
  };

  // Prepare the total fuel consumption data for Bar Chart
  const fuelConsumptionData = {
    labels: ['Fuel Consumption'],
    datasets: [{
      label: 'Total Fuel Consumption',
      data: [analyticsData ? analyticsData.totalFuelConsumption : 0],
      backgroundColor: 'rgba(255, 99, 132, 0.6)',
    }]
  };

  // Prepare the total distance data for Doughnut Chart
  const distanceData = {
    labels: ['Total Distance'],
    datasets: [{
      data: [analyticsData ? analyticsData.totalDistance : 0],
      backgroundColor: ['rgba(54, 162, 235, 0.6)'],
    }]
  };

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

      {/* Fuel Consumption Bar Chart */}
      <div className="chart-container">
        <h4>Total Fuel Consumption</h4>
        {analyticsData && (
          <Bar
            data={fuelConsumptionData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: { beginAtZero: true },
              },
            }}
          />
        )}
      </div>

      {/* Total Distance Doughnut Chart */}
      <div className="chart-container">
        <h4>Total Distance Traveled</h4>
        {analyticsData && (
          <Doughnut
            data={distanceData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              title: { display: true, text: 'Total Distance Traveled' },
            }}
          />
        )}
      </div>
    </div>

  );
};

export default AnalyticsChart;
