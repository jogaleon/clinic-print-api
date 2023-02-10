const express = require('express');
const receiptController = require('../../controllers/receipt.controller');

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

router.param('id', receiptController.fetchReceiptById);

module.exports = router;
 
