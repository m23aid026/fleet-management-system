const express =  require('express');
const cors = require('cors');
const momgoHelper = require('./mongo.js')
// const express = require('express');
// const http = require('http');

// const { MongoClient } = require('mongodb');

// Create Express app
const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

// { deviceId: "zRYzhAEAHAABAAAKCRtcAAsAtwB1gBAS" }
app.get('/api/speed', async (req, res) => {
    try {
        const dataModel = await momgoHelper.mongoHelper('speed');
        const data = await dataModel.findOne({ deviceId: "zRYzhAEAHAABAAAKCRtcAAsAtwB1gBAS" });
        console.log(data);
        res.json([data]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/api/runtime', async (req, res) => {
    try {
        const dataModel = await momgoHelper.mongoHelper('runtime');
        const data = await dataModel.findOne({ deviceId: "zRYzhAEAHAABAAAKCRtcAAsAtwB1gBAS" });
        console.log(data);
        res.json([data]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.listen( PORT , () => console.log("server startng "));
// const server = http.createServer(app);

// MongoDB connection URI

// const client = new MongoClient(uri);

// // Connect to MongoDB
// client.connect(err => {
//     if (err) {
//         console.error('Error connecting to MongoDB', err);
//         return;
//     }
//     console.log('Connected to MongoDB');

//     const db = client.db('local');
//     const collection = db.collection('speed');

//     // API route to fetch all telemetry data
//     app.get('/api/mongo/telemetry', async (req, res) => {
//         try {
//             const data = await collection.findOne({ deviceId: "zRYzhAEAHAABAAAKCRtcAAsAtwB1gBAS" }).toArray(); // Fetch all documents from the collection
//             console.log(data);
//             res.json(data);
//         } catch (error) {
//             res.status(500).send({ error: 'Error fetching data from MongoDB' });
//         }
//     });
//     // Start the server
    
//     server.listen(PORT, () => {
//         console.log(`Server is running on port ${PORT}`);
//     });
// });
