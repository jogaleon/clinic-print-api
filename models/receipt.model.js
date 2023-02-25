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
        default: ""
    },
    cost: {
        type: String,
        default: ""
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
        default: ""
    },
    dosage: {
        type: String,
        default: ""
    },
    quantity: {
        type: String,
        default: ""
    },
    cost: {
        type: String,
        default: ""
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
        default: ""
    },
    dosage: {
        type: String,
        default: ""
    },
    quantity: {
        type: String,
        default: ""
    },
    cost: {
        type: String,
        default: ""
    },
    include: {
        type: Boolean,
        required: true
    }
});

const receiptSchema = new Schema({
    name: {
        type: String,
        default: ""
    },
    number: {
        type: String,
        default: ""
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
