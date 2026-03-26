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
    costInCents: {
        type: Number,
        required: true,
        default: 0
    }
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
        type: Number,
        required: true,
        default: 0
    },
    costInCents: {
        type: Number,
        required: true,
        default: 0
    }
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
        type: Number,
        required: true,
        default: 0
    },
    costInCents: {
        type: Number,
        required: true,
        default: 0
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
    discount: {
        type: {
            type: String,
            default: "None"
        },
        percentage: {
            type: Number,
            required: true,
            default: 0
        }
    },
    discountApply: {
        service: {
            type: Boolean,
            required: true,
            default: true
        },
        additional: {
            type: Boolean,
            required: true,
            default: true
        },
        prescription: {
            type: Boolean,
            required: true,
            default: true
        }
    }
}, { timestamps: true });

module.exports = mongoose.model('Receipt', receiptSchema);