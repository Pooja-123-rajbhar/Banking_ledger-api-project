const mongoose = require('mongoose');


const transcationSchema = new mongoose.Schema({


    fromAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'account',
        required: [true, 'transcation must be  associated with an  from account'],
        index: true,
    },
    toAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'account',
        required: [true, 'transcation must be associated with a to account'],
        index: true,
    },
    status: {
        type: String,
        enum: {
            values: ['pending', 'completed', 'failed',
                "reserved"
            ],
            message: 'Status must be either pending, completed, failed or reserved',


        },
        default: 'pending',
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required for creating a transcation'],
        min: [0, 'Amount must be a positive number']
    },
    idempotencyKey: {
        type: String,
        required: [true, 'Idempotency key is required for creating a transcation'],
        index: true,
        unique: true,
    }
}, {
    timestamps: true


})


const transcationModel = mongoose.model('Transcation', transcationSchema);
module.exports = transcationModel;