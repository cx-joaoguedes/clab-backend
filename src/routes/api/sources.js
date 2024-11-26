const express = require('express');
const multer = require('multer');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const sourcesControllers = require('../../controllers/sources')

router.get('/:project_id/', sourcesControllers.getFileSource)
router.get('/tree/:project_id', sourcesControllers.GetTreeItem)
router.post('/', upload.single('sourceZip'), sourcesControllers.UploadSource)

module.exports = router;