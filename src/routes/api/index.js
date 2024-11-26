const express = require('express');
const router = express.Router();

const projectRoutes = require('./projects')
const sourcesRoutes = require('./sources')
const resultsRoutes = require('./results')
const scanRoutes = require('./scan')
const analysisRoutes = require('./analysis')
const authRoutes = require('./auth')

router.use('/projects', projectRoutes)
router.use('/sources', sourcesRoutes)
router.use('/results', resultsRoutes)
router.use('/scans', scanRoutes)
router.use('/analysis', analysisRoutes)
router.use('/auth', authRoutes)

module.exports = router;