const express = require('express');
const authMiddleware = require("../middleware/auth.middleware");
const accountController = require("../controllers/account.controller");





const router = express.Router();

/**
 * - POST /api/account
 *  - Create a new  account
 * - protected route
 */
router.post('/', authMiddleware.authMiddleware, accountController.createAccountController);
/**
 * - GET /api/account
 *  - Get all accounts
 * - protected route
 */

router.get('/', authMiddleware.authMiddleware, accountController.getuserAccountsController);
/**
 * -Get/ api/account/balance/:accountId
 * -Get the balance of a specific account
 * -protected route
 */
router.get('/balance/:accountId', authMiddleware.authMiddleware, accountController.getAccountBalanceController);



module.exports = router;