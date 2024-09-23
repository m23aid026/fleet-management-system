const mongoose = require('mongoose');

async function mongoHelper(collectionName) {
    const uri = 'mongodb://localhost:27017/local';
    mongoose.connect(uri);
    const db = mongoose.connection;
    db.once('open', () => console.log("connected to db"));

    const DataSchema = new mongoose.Schema({
        _id: mongoose.Schema.Types.ObjectId,
        deviceId: String,
        timestamp: String,
        value: mongoose.Schema.Types.Number,
        variable: String,
        alarmClass: mongoose.Schema.Types.Number
    }, { collection: collectionName });

    const DataModel = mongoose.model(collectionName, DataSchema);
    return DataModel;
}

module.exports = {
    mongoHelper
} 