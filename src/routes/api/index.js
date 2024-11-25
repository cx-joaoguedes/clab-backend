const express = require('express');
const router = express.Router();

const projectRoutes = require('./projects')
const sourcesRoutes = require('./sources')
const resultsRoutes = require('./results')
const scanRoutes = require('./scan')

router.use('/projects', projectRoutes)
router.use('/sources', sourcesRoutes)
router.use('/results', resultsRoutes)
router.use('/scans', scanRoutes)

module.exports = router;