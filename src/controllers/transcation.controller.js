const transactionModel = require("../models/transcation.model");
const ledgerModel = require("../models/ledger.model")
const accountModel = require("../models/account.model");
const emailServices = require("../services/email.service")
const mongoose = require("mongoose");

/**
 * -- cretate a new transaction
 * THE 10-STEP TRANSFER FLOW:

1. Validate request
2. Validate idempotency key
3. Check account status
4. Derive sender balance from ledger
5. Create transaction (PENDING)
6. Create DEBIT ledger entry
7. Create CREDIT ledger entry
8. Mark transaction COMPLETED
9. Commit MongoDB session
10. Send email notification
 * 
 */

async function createTranscation(req, res) {


    /**
     * 1.Validate request
     */
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body

    if (!fromAccount || !toAccount || !amount || !idempotencyKey || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
        return res.status(400).json({
            message: "fromAccount,toAccount,amount and idempotency"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        _id: fromAccount,

    })
    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
    })
    if (!fromUserAccount || !toUserAccount) {
        return res.status(400).json({
            message: "invalid fromAccount or toAccount"
        })
    }
    /**
     * 2. Validate idempotency key
     * iska use isliye karte h ki jb hum koi payment kiye ho pending me rha gya ho to jab server use dubhra send kre pending paymennt ko to idempotency ek par server ko request ki h but pending me tha payment so sever dubhra same idom key dekh kr use negleact kr dnegi taki payment 2 bar na ho
     */


    const istrannscationAlreadyexist = await transactionModel.findOne({
        idempotencyKey: idempotencyKey
    })

    if (istrannscationAlreadyexist) {
        if (istrannscationAlreadyexist.status === "completed") {
            return res.status(200).json({
                message: "Transcation already proceed",
                transaction: istrannscationAlreadyexist
            })
        }
        if (istrannscationAlreadyexist.status === "pending") {
            return res.status(200).json({
                message: "Transcation is still processing"
            })
        }
        if (istrannscationAlreadyexist.status === "failed") {
            return res.status(500).json({
                message: " Transaction processing failed retry"
            })
        }
        if (istrannscationAlreadyexist.status === "Reversed") {
            return res.status(500).json({
                message: "Transaction was revesred please retry"
            })
        }
    }

    /**
     * 3. Check account status
     */
    if (fromUserAccount.status !== "active" || toUserAccount.status !== "active") {
        return res.status(400).json({
            message: "FRromAccount, toAccount and Idempotency key are require"
        })
    }
    /**
     * 4. Derive sender balance from ledger
     */


    const balance = await fromUserAccount.getBalance()
    const transactionAmount = Number(amount)
    if (balance < transactionAmount) {
        return res.status(400).json({
            message: `Insufficient balance. Current balance is ${balance}. Requested amount is ${transactionAmount}`
        })
    }
    try {
        /**
         * 5. Create transaction (PENDING)
         */
        const session = await mongoose.startSession()
        session.startTransaction()
        const transaction = (await transactionModel.create([{
            fromAccount,
            toAccount,
            amount: transactionAmount,
            idempotencyKey,
            status: "pending"

        }], { session }))[0]

        const debitLedgerEntry = await ledgerModel.create([{
            account: fromAccount,
            amount: transactionAmount,
            transaction: transaction._id,
            type: "DEBIT"
        }], { session });



        const creditLedgerEntry = await ledgerModel.create([{
            account: toAccount,
            amount: transactionAmount,
            transaction: transaction._id,
            type: "CREDIT"
        }], { session });

        transaction.status = "completed"
        await transaction.save({ session })
        await session.commitTransaction()
        session.endSession()
    } catch (error) {
        return res.status(400).json({
            message: "tranaction is pending due to some error"
        })
    }
    /**
     * 10.  Send email notification
     *
     */
    try {
        await emailServices.sendTransactionEmail(req.user.email, req.user.name, transactionAmount, toAccount)
    } catch (error) {
        // A notification failure must not make a committed transaction appear to fail.
        console.error("Transaction completed but notification failed:", error)
    }

    return res.status(201).json({
        message: "Transaction complted sucessfully",
        transaction: transaction
    })
}

async function createInitialFundsTransaction(req, res) {
    const { toAccount, amount, idempotencyKey } = req.body

    if (!toAccount || !amount || !idempotencyKey || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
        return res.status(400).json({
            message: "toAccount, amount and idempotencyKey are required"
        })
    }

    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
    })

    if (!toUserAccount) {
        return res.status(400).json({
            message: "Invalid toAccount"
        })
    }

    const fromUserAccount = await accountModel.findOne({

        user: req.user._id
    })

    if (!fromUserAccount) {
        return res.status(400).json({
            message: "System user account not found"
        })
    }

    try {
        const transactionAmount = Number(amount)
        const session = await mongoose.startSession()
        session.startTransaction()

        const transaction = (await transactionModel.create([{
            fromAccount: fromUserAccount._id,
            toAccount,
            amount: transactionAmount,
            idempotencyKey,
            status: "pending"
        }], { session }))[0]

        const debitLedgerEntry = await ledgerModel.create([{
            account: fromUserAccount._id,
            amount: transactionAmount,
            transaction: transaction._id,
            type: "DEBIT"
        }], { session });


        await (() => {
            return new Promise((resolve) => setTimeout(resolve, 1000 * 1000))
        })()

        const creditLedgerEntry = await ledgerModel.create([{
            account: toAccount,
            amount: transactionAmount,
            transaction: transaction._id,
            type: "CREDIT"
        }], { session });

        //    transaction.status = "completed"
        // await transaction.save({ session })
        await transactionModel.findOneAndUpdate({
            _id: transaction._id
        }, {
            status: "completed"
        }, {
            session

        })

        await session.commitTransaction()
        session.endSession()

    } catch (error) {
        return res.status(400).json({
            message: "tranaction is pending due to some error"
        })
    }

    /**
     * 10. Send email notification
     */
    await emailServices.sendTransactionEmail(req.user.email, req.user.name, transactionAmount, toAccount)
    return res.status(201).json({
        message: "Initial funds transaction completed successfully",
        transaction: transaction
    })
}
module.exports = { createTranscation, createInitialFundsTransaction }