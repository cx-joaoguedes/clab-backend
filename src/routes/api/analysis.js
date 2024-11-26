const express = require('express');
const router = express.Router();

const analysisController = require('../../controllers/analysis')

const authenticate = require('../../middleware/authenticate')

router.post('/', authenticate ,analysisController.CreateAnalysis)
router.get('/:result_unique_id', analysisController.GetAnalysis)

module.exports = router;