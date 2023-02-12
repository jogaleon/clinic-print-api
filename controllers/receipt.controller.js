const mongoose = require('mongoose');
const Receipt = require('../models/receipt.model');

const getAllReceipts = async (req, res) => {
    try {
        const allReceipts = await Receipt.find();
        res.send(allReceipts);
    } catch (err) {
        res.sendStatus(500);
        console.error(err);
    }
}

const addReceipt = async (req, res) => {
    const { name, number, service, additional, prescription } = req.body;
    try {
        const newReceipt = await Receipt.create({
            name,
            number,
            service,
            additional,
            prescription
        });
        res.send(newReceipt);
    } catch (err) {
        res.sendStatus(500);
        console.error(err);
    }
}

const deleteAllReceipts = async (req, res) => {
    try {
        const receipts = await Receipt.deleteMany();
        res.send(receipts);
    } catch (err) {
        res.sendStatus(500);
        console.error(err);
    }
}

const updateReceipt = async (req, res) => {
    const { name, number, service, additional, prescription } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (number) updates.number = number;
    if (service) updates.service = service;
    if (additional) updates.additional = additional;
    if (prescription) updates.prescription = prescription;

    try {
        const updatedReceipt = await Receipt.findByIdAndUpdate({updates});
        res.send(updatedReceipt);
    } catch(err) {
        res.sendStatus(500);
        console.error(err);
    }
}

const deleteReceipt = async (req, res) => {
    try {
        const deletedReceipt = await Receipt.findByIdAndDelete(req.params.id);
        if (!deletedUser) return res.json({ msg: "No receipt with that ID found." })
        res.send(deletedUser);

    } catch(err) {
        res.sendStatus(500);
        console.error(err);
    }
}

const getReceipt = async (req, res) => {
    res.send("get a receipt");
    try {
    
    } catch(err) {
        res.sendStatus(500);
        console.error(err);
    }
}

const validateId = (req, res, next, id) => {
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ errMsg: "Not a valid receipt ID" });
    next();
}


module.exports = {
    getAllReceipts,
    addReceipt,
    deleteAllReceipts,
    updateReceipt,
    deleteReceipt,
    getReceipt,
    validateId
}