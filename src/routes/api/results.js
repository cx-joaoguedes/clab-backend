const express = require('express');
const multer = require('multer');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const resultsController = require('../../controllers/results')

const authenticate = require('../../middleware/authenticate')

router.post('/', authenticate, upload.single('resultsFile') ,resultsController.UploadResults)
router.get('/nodes/:result_id', resultsController.GetResultNodes)
router.get('/:project_id/:scan_id', resultsController.GetResults)

module.exports = router;