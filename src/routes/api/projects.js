const express = require('express');
const router = express.Router();

const projectsControllers = require('../../controllers/projects')

const authenticate = require('../../middleware/authenticate')

router.get('/', projectsControllers.getProjects)
router.post('/', authenticate, projectsControllers.createProject)

module.exports = router;