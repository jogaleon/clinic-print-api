const mongoose = require('mongoose');
const Receipt = require('../models/receipt.model');

const getAllReceipts = async (req, res) => {
    try {
        const receipts = await Receipt.find();
        res.send(receipts);
    } catch(err) {
        res.sendStatus(500);
        console.error(err);
    }
}

const addReceipt = async (req, res) => {
    const { name, number, service, additional, prescription } = req.body;
    res.send("add receipt");
}

const editReceipt = async (req, res) => {
    res.send("edit receipt");
}

const deleteReceipt = async (req, res) => {
    res.send("delete receipt");
}

const getReceipt = async (req, res) => {
    res.send("get a receipt");
}

const fetchReceiptById = async (req, res, next) => {

}


module.exports = {
    getAllReceipts,
    addReceipt,
    editReceipt,
    deleteReceipt,
    getReceipt,
    fetchReceiptById
}