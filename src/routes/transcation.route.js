const { Router } = require("express")
const authMiddleware = require("../middleware/auth.middleware")
const transactionController = require("../controllers/transcation.controller")



const transcationRoutes = Router();


/**
 * - post/api/transaction/
 * - create a new transaction
 */



transcationRoutes.post("/", authMiddleware.authMiddleware, transactionController.createTranscation)
    /**
     * post/api/transaction/system/initial-funds
     * - create a new transaction for initial funds
     * - protected route
     */
transcationRoutes.post("/system/initial-funds", authMiddleware.authSystemUserMiddleware, transactionController.createInitialFundsTransaction)




module.exports = transcationRoutes;