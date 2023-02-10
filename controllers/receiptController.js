const mongoose = require('mongoose');

const getAllReceipts = (req, res) => {
    res.send("get all receipts");
}

const addReceipt = (req, res) => {
    res.send("add receipt");
}

const editReceipt = (req, res) => {
    res.send("edit receipt");
}

const deleteReceipt = (req, res) => {
    res.send("delete receipt");
}

const getReceipt = (req, res) => {
    res.send("get a receipt");
}

const fetchReceiptById = (req, res, next) => {

}


module.exports = {
    getAllReceipts,
    addReceipt,
    editReceipt,
    deleteReceipt,
    getReceipt,
}