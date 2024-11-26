// loaders/socketLoader.js
const socketIo = require('socket.io');
const socketHandler = require('../sockets/handler');

module.exports = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: '*', // Adjust as needed
      methods: ['GET', 'POST'],
    },
  });

  // Pass `io` to the handler to set up events
  socketHandler(io);

  // Return the initialized `io` instance
  return io;
};
