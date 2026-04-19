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
    },
    serviceCategory: {
        type: String,
        enum: ['professional_fee', 'clinic', 'laboratory'],
        default: 'clinic'
    },
    labLineKind: {
        type: String,
        enum: ['test', 'package'],
        default: 'test'
    },
    labPackageConcession: {
        type: String,
        enum: ['none', 'member', 'senior_pwd'],
        default: 'none'
    },
    excludeFromSectionPercent: {
        type: Boolean,
        default: false
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
    },
    additionalCategory: {
        type: String,
        enum: ['service_materials', 'additional_medicine'],
        default: 'additional_medicine'
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
    doctor: {
        type: String,
        default: ""
    },
    transactionType: {
        type: String,
        enum: ['general', 'pharmacy', 'laboratory'],
        default: 'general'
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
        },
        packageFlatFeeCents: {
            type: Number,
            default: 0
        }
    },
    discountApply: {
        professionalFee: {
            type: Boolean,
            required: true,
            default: true
        },
        clinicServices: {
            type: Boolean,
            required: true,
            default: true
        },
        laboratoryServices: {
            type: Boolean,
            required: true,
            default: true
        },
        serviceMaterials: {
            type: Boolean,
            required: true,
            default: true
        },
        additionalMeds: {
            type: Boolean,
            required: true,
            default: true
        },
        prescriptionMeds: {
            type: Boolean,
            required: true,
            default: true
        }
    }
}, { timestamps: true });

module.exports = mongoose.model('Receipt', receiptSchema);
