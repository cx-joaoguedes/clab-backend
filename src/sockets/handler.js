module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('sourceUploadProgression', (projectId) => {
      if (projectId) {
        socket.join(`upload-progress-${projectId}`);
        console.log(`Client ${socket.id} joined project ${projectId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};
