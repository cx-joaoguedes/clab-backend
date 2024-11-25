const express = require('express');
const router = express.Router();

const scanController = require('../../controllers/scan')

router.get('/:project_id', scanController.getScans)
router.get('/content/:content_id', scanController.getScanFileContent)

module.exports = router;