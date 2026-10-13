const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const emailservices = require("../services/email.service");
const tokenBlacklistModel = require("../models/blackList.model");


/**
 * USER REGISTRATION
 * @route POST /api/auth/register
 * @desc Register a new user
 */


async function userRegisterController(req, res) {



    const { name, email, password } = req.body;


    const isExists = await userModel.findOne({
        email

    });
    if (isExists) {
        return res.status(422).json({
            message: "User already exists",
            status: "failed"
        });
    }

    const user = await userModel.create({ name, email, password });
    const token = jwt.sign({ userID: user._id }, process.env.JWT_SECRET, { expiresIn: "3d" });
    res.cookie("token", token);

    await emailservices.sendRegistrationEmail(
        email,
        "Welcome to Backend Ledger",
        `Hello ${name}, your account has been created successfully.`,
        `<p>Hello ${name},</p><p>Your account has been created successfully.</p>`
    );

    return res.status(201).json({
        user: {
            _id: user._id,
            name: user.name,
            email: user.email
        },
        token: token
    });

}


/**
 * user login controller
 * -post /api/auth/login
 */

async function userLoginController(req, res) {

    const { email, password } = req.body

    const user = await userModel.findOne({ email }).select("+password");
    if (!user) {
        return res.status(401).json({
            message: "Invalid credentials",
            status: "failed"
        });
    }
    const isValidPassword = await user.comparePassword(password)
    if (!isValidPassword) {
        return res.status(401).json({
            message: "Invalid credentials",
            status: "failed"
        });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "3d" });
    res.cookie("token", token)
    res.status(200).json({
        user: {
            _id: user._id,
            name: user.name,
            email: user.email
        },
        token: token
    })

}
/**
 * user logout controller
 * -post /api/auth/logout
 */
async function userLogoutController(req, res) {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(400).json({
            message: "Token is required for logout",
            status: "failed"
        });


    }
    await tokenBlacklistModel.create({ token });
    res.clearCookie("token");
    return res.status(200).json({
        message: "User logged out successfully",
        status: "success"
    });
}
module.exports = { userRegisterController, userLoginController, userLogoutController }
