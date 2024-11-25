require('dotenv').config();
const mongoose = require('mongoose');
const gridFSManager = require('./gridfs');
const mongo_uri = process.env.MONGO_URI;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(mongo_uri);
    gridFSManager.init()
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
