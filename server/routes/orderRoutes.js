const express = require('express');
const router = express.Router();
const {
  placeOrder,
  getCustomerOrders,
  getRestaurantOrders,
  getAdminOrders,
  getOrderById,
  updateOrderStatus,
} = require('../controllers/orderController');
const { validateOrder } = require('../middleware/validators');
const { protect, requireRole } = require('../middleware/authMiddleware');

router.post('/', protect, validateOrder, placeOrder);
router.get('/customer', protect, getCustomerOrders);
router.get('/restaurant', protect, requireRole(['restaurant', 'admin']), getRestaurantOrders);
router.get('/admin', protect, requireRole(['admin']), getAdminOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, updateOrderStatus);

module.exports = router;
