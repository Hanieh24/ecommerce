const express = require('express');
const router = express.Router();

const adminOrderController = require('../controllers/adminOrderController');
const { authenticate, requireAdmin } = require('../middlewares/authMiddleware');

router.use(authenticate, requireAdmin);

router.get('/', adminOrderController.listOrders);
router.get('/:id', adminOrderController.getOrderById);
router.patch('/:id/status', adminOrderController.updateOrderStatus);
router.post('/:id/accept', adminOrderController.acceptOrder);
router.post('/:id/reject', adminOrderController.rejectOrder);

module.exports = router;
