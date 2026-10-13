const express = require("express");
const cookieParser = require("cookie-parser");



const app = express();


app.use(express.json());
app.use(cookieParser());
/*
routes
 */

const authRouter = require("./routes/auth.routes");
const accountRouter = require("./routes/account.route");
const transcationRoutes = require("./routes/transcation.route")

/**
 * use routes
 */
app.get("/", (req, res) => {

        res.send("Welcome to the backend ledger API up and running");
    })
    /*
    --user routes
     */

app.use("/api/auth", authRouter);
app.use("/api/accounts", accountRouter);
app.use("/api/transaction", transcationRoutes)






module.exports = app;