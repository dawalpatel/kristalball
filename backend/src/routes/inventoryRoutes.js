const express = require('express');
const { getInventory } = require('../controllers/inventoryController');
const { authenticateToken, verifyBaseAccess } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, verifyBaseAccess, getInventory);

module.exports = router;
