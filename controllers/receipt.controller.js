const mongoose = require('mongoose');
const Receipt = require('../models/receipt.model');

const getAllReceipts = async (req, res) => {
    try {
        const allReceipts = await Receipt.find();
        res.status(200).send(allReceipts);
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
        res.status(200).send(newReceipt);
    } catch (err) {
        res.status(500).send(err);
        console.error(err);
    }
}

const deleteAllReceipts = async (req, res) => {
    try {
        const receipts = await Receipt.deleteMany();
        res.status(200).send(receipts);
    } catch (err) {
        res.sendStatus(500);
        console.error(err);
    }
}

const updateReceipt = async (req, res) => {
    const updates = req.body
    try {
        const updatedReceipt = await Receipt.findByIdAndUpdate(req.params.id, { ...updates }, { new: true });
        if (!updatedReceipt) return res.status(404).json({ message: "No receipt with provided ID found." });
        res.status(200).send(updatedReceipt);
    } catch(err) {
        res.sendStatus(500);
        console.error(err);
    }
}

const deleteReceipt = async (req, res) => {
    try {
        const deletedReceipt = await Receipt.findByIdAndDelete(req.params.id);
        if (!deletedReceipt) return res.status(404).json({ message: "No receipt with provided ID found." });
        res.status(200).send(deletedReceipt);
        
    } catch(err) {
        res.sendStatus(500);
        console.error(err);
    }
}

const getReceipt = async (req, res) => {
    try {
        const foundReceipt = await Receipt.findById(req.params.id);
        if (!foundReceipt) return res.status(404).json({ message: "No receipt with provided ID found." });
        res.status(200).send(foundReceipt);
    } catch(err) {
        res.sendStatus(500);
        console.error(err);
    }
}

const validateId = (req, res, next, id) => {
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Not a valid receipt ID" });
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