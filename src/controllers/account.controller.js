const accountModel = require("../models/account.model");


async function createAccountController(req, res) {
    const userId = req.user;

    const account = await accountModel.create({
        user: userId
    })
    res.status(201).json({
        message: "account created successfully",
        account: account
    })

}
async function getAllAccountsController(req, res) {
    const accounts = await accountModel.find({}).populate("user", "name email")
    res.status(200).json({
        message: "accounts fetched successfully",
        accounts: accounts
    })
}
async function getuserAccountsController(req, res) {
    const accounts = await accountModel.find({ user: req.user._id });
    res.status(200).json({

        accounts: accounts

    })
}
async function getAccountBalanceController(req, res) {
    const {
        accountId
    } = req.params;
    const account = await accountModel.findOne({
        _id: accountId,
        user: req.user._id
    });
    if (!account) {
        return res.status(404).json({
            message: "Account not found"
        });
    }
    const balance = await account.getBalance();
    res.status(200).json({
        message: "Account balance fetched successfully",
        accountId: account._id,
        balance: balance
    })
}

module.exports = { createAccountController, getAllAccountsController, getuserAccountsController, getAccountBalanceController }