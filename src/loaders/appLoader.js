const express = require('express');
const swaggerUi = require('swagger-ui-express');
const cookieParser = require('cookie-parser')
const swaggerDocument = require('../../swagger/swagger.json');
const apiRoutes = require('../routes/api');

module.exports = (app) => {
  // JSON body parsing middleware
  app.use(express.json());

  // Cookie parsing middleware
  app.use(cookieParser())

  // API routes
  app.use('/api', apiRoutes);

  // Swagger documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // Landing page
  app.get('/', (req, res) => res.send('Landing Route for webservice'));

  // Non-Existing Route
  app.use((req, res, next) => {
    const error = new Error('Route not Found');
    error.status = 404;
    next(error);
  });

  // Error-handling middleware
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
    });
  });
};
