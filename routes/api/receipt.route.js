const express = require('express');
const receiptController = require('../../controllers/receipt.controller');

const router = express.Router();

router.route('/')
    .get(receiptController.getAllReceipts)
    .post(receiptController.addReceipt)
    .delete(receiptController.deleteAllReceipts);
;

router.route('/:id')
    .patch(receiptController.updateReceipt)
    .delete(receiptController.deleteReceipt)
    .get(receiptController.getReceipt)
;

router.param('id', receiptController.validateId);

module.exports = router;
 
