const express = require('express');
const receiptController = require('../../controllers/receiptController');

const router = express.Router();

router.route('/')
    .get(receiptController.getAllReceipts)
    .post(receiptController.addReceipt)
;

router.route('/:id')
    .put(receiptController.editReceipt)
    .delete(receiptController.deleteReceipt)
    .get(receiptController.getReceipt)
;

router.param('id')

module.exports = router;
 
