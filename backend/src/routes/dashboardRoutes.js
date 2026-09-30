const express = require('express');
const { getDashboard } = require('../controllers/dashboardController');
const { authenticateToken, verifyBaseAccess } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, verifyBaseAccess, getDashboard);

module.exports = router;
