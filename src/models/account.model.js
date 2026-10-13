const mongoose = require('mongoose');
const ledgerModel = require('./ledger.model');

const accountSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required'],
        index: true,
    },
    status: {
        type: String,
        enum: {
            values: ['active', 'inactive', 'suspended'],
            message: 'Status must be either active, inactive, or suspended',
        },
        default: 'active',
        required: [true, 'Status is required'],
        index: true,
    },
    currency: {
        type: String,
        required: [true, 'Currency is required'],
        default: 'INR',
        index: true,
    }
}, {
    timestamps: true,
});

accountSchema.index({ user: 1, status: 1 }, { unique: true });

accountSchema.methods.getBalance = async function() {
    const balanceData = await ledgerModel.aggregate([
        { $match: { account: this._id } },
        {
            $group: {
                _id: null,
                totalDebit: {
                    $sum: {
                        $cond: [{ $eq: ['$type', 'DEBIT'] }, '$amount', 0],
                    },
                },
                totalCredit: {
                    $sum: {
                        $cond: [{ $eq: ['$type', 'CREDIT'] }, '$amount', 0],
                    },
                },
            },
        },
        {
            $project: {
                _id: 0,
                balance: { $subtract: ['$totalCredit', '$totalDebit'] },
            },
        },
    ]);

    if (balanceData.length === 0) {
        return 0;
    }

    return balanceData[0].balance ? balanceData[0].balance : 0;
};

const accountModel = mongoose.model('Account', accountSchema);

module.exports = accountModel;