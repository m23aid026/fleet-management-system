import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet'; 

const carIcon = new L.Icon({
  iconUrl: 'https://img.icons8.com/ios-filled/50/000000/car--v1.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const AllCars = () => {
  const [vehicleLocations, setVehicleLocations] = useState([]);

  // Fetch last known locations of all vehicles
  const fetchVehicleLocations = async () => {
    const vehicleIds = [1, 2, 3, 4, 5]; // Array of vehicle IDs
    try {
      const requests = vehicleIds.map(id =>
        axios.get(`https://kafka-consumer-830340334999.us-central1.run.app/analytics/${id}`)
      );
      
      const responses = await Promise.all(requests);
      const locations = responses.map(response => response.data); // Extracting data from responses
      setVehicleLocations(locations);
    } catch (error) {
      console.error('Error fetching vehicle locations:', error);
    }
  };

  useEffect(() => {
    fetchVehicleLocations();
  }, []);

  return (
    <div className="analytics-container">
      <h4>Last Known Locations of All Vehicles</h4>
      <MapContainer center={[26.46634828, 73.11541134]} zoom={12} scrollWheelZoom={true} style={{ height: "400px", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
        />
        {vehicleLocations.map((vehicle) => (
          <Marker 
            key={vehicle._id} 
            position={[vehicle.lastCoordinates.latitude, vehicle.lastCoordinates.longitude]} 
            icon={carIcon}
          >
            <Popup>
              Vehicle {vehicle._id}'s last known location.<br />
              Speed: {vehicle.speed} km/h<br />
              Last updated: {new Date(vehicle.timestamp).toLocaleString()}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default AllCars;
