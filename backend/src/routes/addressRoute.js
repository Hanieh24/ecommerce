const express = require('express');
const router = express.Router();

const addressController = require('../controllers/addressController');
const { authenticate } = require('../middlewares/authMiddleware');

router.get('/titles', addressController.listAddressTitles);

router.use(authenticate);

router.get('/', addressController.listAddresses);
router.post('/', addressController.createAddress);

module.exports = router;
