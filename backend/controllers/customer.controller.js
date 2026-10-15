const bcrypt = require("bcrypt");
const Customer = require("../models/customer.model");
const generateToken = require("../utils/generateToken");

const registerCustomer = async (req, res) => {
    try {
        // in Express 5, req.body is undefined when no JSON body is sent
        const { fullName, email, password, phone } = req.body || {};

        if (!fullName || !email || !password || !phone) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        if (typeof password !== "string") {
            return res.status(400).json({
                success: false,
                message: "Password must be a string"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 6 characters"
            });
        }

        const existingCustomer = await Customer.findOne({ email });

        if (existingCustomer) {
            return res.status(409).json({
                success: false,
                message: "Email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const customer = await Customer.create({
            fullName,
            email,
            password: hashedPassword,
            phone
        });

        return res.status(201).json({
            "success": true,
            "message": "Customer registered successfully",
            "customer": {
                "_id": customer.id,
                "fullName": customer.fullName,
                "email": customer.email,
                "phone": customer.phone
            }
        });
    }
    catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

const loginCustomer = async (req, res) => {
    try {
        const { email, password } = req.body || {};

        if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const customer = await Customer.findOne({ email });

        if (!customer) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        // do not decrypt the hash.
        // bcrypt is designed for one-way password hashing. 
        // We verify a password by comparing it against the stored hash rather than decrypting it.
        const passwordMatch = await bcrypt.compare(password, customer.password);

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        // use utility to create a JWT containing the customer's id
        const token = generateToken(customer._id);

        res.cookie("token", token, {
            httpOnly: true,     // browser JS can't access the cookie through document.cookie, so it protects token from being stolen
            secure: false,      // assuming local HTTP development, in production HTTPS deployment you'd use secure: true
            sameSite: "lax",    // Provides additional protection around cross-site cookie sending.
            maxAge: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
        });

        return res.status(200).json({
            success: true,
            message: "Login successful"
        });
    }
    catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

const getProfile = async (req, res) => {
    try {
        return res.status(200).json(req.user);
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

const logoutCustomer = async (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: false,
            sameSite: "lax"
        });

        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body || {};

        if (typeof oldPassword !== "string" || typeof newPassword !== "string" || !oldPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Old password and new password are required"
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "New password must contain atleast 6 characters"
            });
        }

        const customer = await Customer.findById(req.user._id);

        const passwordMatch = await bcrypt.compare(oldPassword, customer.password);

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid old password"
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        customer.password = hashedPassword;

        await customer.save();

        return res.status(200).json({
            success: true,
            message: "Password changed successfully"
        });
    }
    catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

module.exports = {
    registerCustomer,
    loginCustomer,
    getProfile,
    logoutCustomer,
    changePassword
};