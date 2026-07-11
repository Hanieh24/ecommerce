const express = require('express');
const router = express.Router();

const productController = require('../controllers/productController');
const { authenticate, requireAdmin } = require('../middlewares/authMiddleware');
const { productBodyParser } = require('../middlewares/productBodyParser');

router.get('/', productController.listProducts);
router.get('/:id', productController.getProductById);
router.post('/', authenticate, requireAdmin, productBodyParser, productController.createProduct);
router.put('/:id', authenticate, requireAdmin, productBodyParser, productController.updateProduct);
router.delete('/:id', authenticate, requireAdmin, productController.deleteProduct);

module.exports = router;
