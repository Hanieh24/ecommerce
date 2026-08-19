const express = require('express');
const router = express.Router();

const cartController = require('../controllers/cartController');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.get('/', cartController.getCart);
router.post('/items', cartController.addCartItem);
router.put('/items/:productId', cartController.updateCartItem);
router.delete('/items/:productId', cartController.removeCartItem);
router.delete('/', cartController.clearCart);

module.exports = router;
