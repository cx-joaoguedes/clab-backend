const express = require('express');
const multer = require('multer');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const resultsController = require('../../controllers/results')

router.post('/', upload.single('resultsFile') ,resultsController.UploadResults)

module.exports = router;