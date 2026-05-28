const express = require('express');
const router = express.Router();
const { addFoodItem, updateFoodItem, deleteFoodItem } = require('../controllers/foodController');
const { validateFoodItem } = require('../middleware/validators');
const { protect, requireRole } = require('../middleware/authMiddleware');

router.post('/', protect, requireRole(['restaurant', 'admin']), validateFoodItem, addFoodItem);
router.put('/:id', protect, requireRole(['restaurant', 'admin']), updateFoodItem);
router.delete('/:id', protect, requireRole(['restaurant', 'admin']), deleteFoodItem);

module.exports = router;
