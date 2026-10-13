const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const tokenBlacklistModel = require("../models/blackList.model");


async function authMiddleware(req, res, next) {
    const token = req.cookies.token || req.headers.authorization.split(" ")[1];
    if (!token) {
        return res.status(401).json({
            message: "token not found",
            status: "failed"
        });
    }
    const blacklistedToken = await tokenBlacklistModel.findOne({ token });
    if (blacklistedToken) {
        return res.status(401).json({
            message: "Token is blacklisted. Please log in again.",
            status: "failed"
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decoded.id);
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            message: " unauthorised person invalid token",
            status: "failed"
        });
    }
}
async function authSystemUserMiddleware(req, res, next) {

    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access, token is missing"
        })
    }
    const blacklistedToken = await tokenBlacklistModel.findOne({ token })
    if (blacklistedToken) {
        return res.status(401).json({
            message: "Token is blacklisted. Please log in again."
        })
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        const user = await userModel.findById(decoded.id).select("+systemUser")

        if (!user || !user.systemUser) {
            return res.status(403).json({
                message: "Forbidden access, not a system user"
            })
        }

        req.user = user

        return next()
    } catch (err) {
        console.error("Authentication error:", err)
        return res.status(401).json({
            message: "Unauthorized access, token is invalid"
        })
    }
}



module.exports = { authMiddleware, authSystemUserMiddleware }
