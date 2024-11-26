const express = require('express');
const router = express.Router();

const authController = require('../../controllers/auth')

const authenticate = require('../../middleware/authenticate')

router.post('/login',authController.Login)
router.get('/validate', authenticate, authController.ValidateToken)

module.exports = router;