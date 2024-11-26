const express = require('express');
const http = require('http');
const connectDB = require('./config/database');
const socketLoader = require('./loaders/socketLoader');
const appLoader = require('./loaders/appLoader');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Connect to the database
connectDB();

// Initialize loaders (middlewares, routes, etc.)
appLoader(app);

// Create HTTP server for socket.io
const server = http.createServer(app);

// Load socket.io and register event handlers
const io = socketLoader(server);

// Register `io` globally using app.set()
app.set('io', io);

// Start the server
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
