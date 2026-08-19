const express = require('express');
const router = express.Router();

const orderController = require('../controllers/orderController');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.post('/checkout', orderController.createCheckout);
router.get('/', orderController.listUserOrders);
router.post('/:id/received', orderController.confirmOrderReceived);
router.get('/:id', orderController.getUserOrderById);

module.exports = router;
