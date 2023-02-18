const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const serviceSchema = new Schema({
    id: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    cost: {
        type: String,
        required: true
    },
});

const additionalSchema = new Schema({
    id: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    dosage: {
        type: String,
        required: true
    },
    quantity: {
        type: String,
        required: true
    },
    cost: {
        type: String,
        required: true
    },    
});

const prescriptionSchema = new Schema({
    id: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    dosage: {
        type: String,
        required: true
    },
    quantity: {
        type: String,
        required: true
    },
    cost: {
        type: String,
        required: true
    },
    include: {
        type: Boolean,
        required: true
    }
});

const receiptSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    number: {
        type: String,
        required: true
    },
    service: {
        type: [serviceSchema],
        required: true
    },
    additional: {
        type: [additionalSchema],
        required: true
    },
    prescription: {
        type: [prescriptionSchema],
        required: true
    },
}, { timestamps: true });

module.exports = mongoose.model('Receipt', receiptSchema);

// id: string,
// type: S
// name: string,
// dosage: string,
// quantity: string,
// cost: string,
// include: boolean