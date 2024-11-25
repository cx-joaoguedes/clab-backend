const express = require('express');
const router = express.Router();

const projectsControllers = require('../../controllers/projects')

router.get('/', projectsControllers.getProjects)
router.post('/', projectsControllers.createProject)

module.exports = router;