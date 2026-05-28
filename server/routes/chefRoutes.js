const express = require('express');
const router = express.Router();
const { chat, recommend } = require('../controllers/chefController');

router.post('/chat', chat);
router.post('/recommend', recommend);

module.exports = router;
