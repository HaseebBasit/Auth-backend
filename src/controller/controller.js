import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

import {
    findUserByEmail,
    createUser,
    verifyUserEmail,
    saveResetToken,
    resetUserPassword,
    saveVerificationCode,
    getLatestVerificationCode,
    markVerificationCodeUsed
} from "../model/model.js";

dotenv.config();


// ======================================================
// ==================== EMAIL SETUP =====================
// ======================================================

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    family: 4,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
});

transporter.verify((error) => {
    if (error) {
        console.log("SMTP CONNECTION ERROR:", error);
    } else {
        console.log("SMTP SERVER IS READY");
    }
});


// ======================================================
// ==================== TEST CONTROLLER =================
// ======================================================

export const home = (req, res) => {
    res.send("Server is running!");
};


// ======================================================
// ==================== CREATE USER =====================
// ======================================================

export const registerUser = async (req, res) => {

    const {
        name,
        email,
        password
    } = req.body;

    try {

        if (!name || !email || !password) {

            return res.status(400).json({
                message:
                    "Name, email and password are required"
            });

        }

        if (password.length < 8) {

            return res.status(400).json({
                message:
                    "Password must be at least 8 characters"
            });

        }

        // Check existing user

        const existingUser =
            await findUserByEmail(email);

        if (existingUser.length > 0) {

            return res.status(400).json({
                message:
                    "User already exists"
            });

        }

        // Hash password

        const hashedPassword =
            await bcrypt.hash(password, 10);

        // Create user

        const user = await createUser(
            name,
            email,
            hashedPassword
        );

        res.status(201).json({

            message:
                "User created successfully",

            user

        });

    }
    catch (err) {

        console.log(
            "Create user error:",
            err
        );

        res.status(500).json({
            message: "Server error"
        });

    }
};


// ======================================================
// ==================== LOGIN ============================
// ======================================================

export const loginUser = async (req, res) => {

    const {
        email,
        password
    } = req.body;

    try {

        const users =
            await findUserByEmail(email);

        if (users.length === 0) {

            return res.status(404).json({
                message: "User not found"
            });

        }

        const user = users[0];

        // Check password

        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!passwordMatch) {

            return res.status(401).json({
                message: "Invalid password"
            });

        }

        // Check email verification

        if (!user.is_verified) {

            return res.status(403).json({
                message:
                    "Please verify your email first"
            });

        }

        res.json({

            message:
                "Login successful",

            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }

        });

    }
    catch (err) {

        console.log(
            "Login error:",
            err
        );

        res.status(500).json({
            message: "Server error"
        });

    }
};


// ======================================================
// ==================== SEND EMAIL OTP ===================
// ======================================================

export const sendEmailOTP = async (req, res) => {

    const { email } = req.body;

    try {

        // Check user

        const users =
            await findUserByEmail(email);

        if (users.length === 0) {

            return res.status(404).json({
                message: "User not found"
            });

        }

        // Generate OTP

        const otp =
            crypto
                .randomInt(100000, 1000000)
                .toString();

        // Hash OTP

        const codeHash =
            crypto
                .createHash("sha256")
                .update(otp)
                .digest("hex");

        // Expire after 10 minutes

        const expiresAt =
            new Date(
                Date.now() + 10 * 60 * 1000
            );

        // Save OTP

        await saveVerificationCode(
            email,
            codeHash,
            "email_verification",
            expiresAt
        );

        // Send email

        await transporter.sendMail({

            from:
                `"Your App" <${process.env.SMTP_FROM}>`,

            to: email,

            subject:
                "Email Verification OTP",

            html: `
                <div style="
                    font-family: Arial;
                    padding: 30px;
                ">

                    <h2>Email Verification</h2>

                    <p>
                        Your verification OTP is:
                    </p>

                    <h1 style="
                        letter-spacing: 8px;
                        text-align: center;
                    ">
                        ${otp}
                    </h1>

                    <p>
                        This OTP will expire
                        in 10 minutes.
                    </p>

                </div>
            `

        });

        res.json({
            message:
                "OTP sent successfully"
        });

    }
    catch (err) {

        console.log(
            "SEND OTP ERROR:",
            err
        );

        res.status(500).json({
            message:
                "Failed to send OTP"
        });

    }
};


// ======================================================
// ==================== VERIFY EMAIL OTP ================
// ======================================================

export const verifyEmailOTP = async (req, res) => {

    const {
        email,
        otp
    } = req.body;

    try {

        const codes =
            await getLatestVerificationCode(
                email,
                "email_verification"
            );

        if (codes.length === 0) {

            return res.status(400).json({
                message:
                    "OTP not found"
            });

        }

        const otpData = codes[0];

        // Check expiry

        if (
            new Date() >
            new Date(otpData.expires_at)
        ) {

            return res.status(400).json({
                message:
                    "OTP expired"
            });

        }

        // Hash entered OTP

        const enteredHash =
            crypto
                .createHash("sha256")
                .update(otp)
                .digest("hex");

        // Compare

        if (
            enteredHash !==
            otpData.code_hash
        ) {

            return res.status(400).json({
                message:
                    "Invalid OTP"
            });

        }

        // Mark OTP used

        await markVerificationCodeUsed(
            otpData.id
        );

        // Verify user

        await verifyUserEmail(email);

        res.json({
            message:
                "Email verified successfully"
        });

    }
    catch (err) {

        console.log(
            "Verify OTP error:",
            err
        );

        res.status(500).json({
            message: "Server error"
        });

    }
};


// ======================================================
// ==================== FORGOT PASSWORD ==================
// ======================================================

export const forgotPassword = async (req, res) => {

    const { email } = req.body;

    try {

        // Check user

        const users =
            await findUserByEmail(email);

        if (users.length === 0) {

            return res.status(404).json({
                message:
                    "User not found"
            });

        }

        // Generate OTP

        const otp =
            crypto
                .randomInt(100000, 1000000)
                .toString();

        // Hash OTP

        const codeHash =
            crypto
                .createHash("sha256")
                .update(otp)
                .digest("hex");

        // Expire after 10 minutes

        const expiresAt =
            new Date(
                Date.now() + 10 * 60 * 1000
            );

        // Save reset OTP

        await saveVerificationCode(
            email,
            codeHash,
            "password_reset",
            expiresAt
        );

        // Send email

        await transporter.sendMail({

            from:
                `"Your App" <${process.env.SMTP_FROM}>`,

            to: email,

            subject:
                "Password Reset OTP",

            html: `
                <div style="
                    font-family: Arial;
                    padding: 30px;
                ">

                    <h2>Password Reset</h2>

                    <p>
                        Your password reset OTP is:
                    </p>

                    <h1 style="
                        letter-spacing: 8px;
                        text-align: center;
                    ">
                        ${otp}
                    </h1>

                    <p>
                        This OTP will expire
                        in 10 minutes.
                    </p>

                </div>
            `

        });

        res.json({
            message:
                "Password reset OTP sent successfully"
        });

    }
    catch (err) {

        console.log(
            "FORGOT PASSWORD ERROR:",
            err
        );

        res.status(500).json({
            message:
                "Failed to send reset OTP"
        });

    }
};


// ======================================================
// ================ VERIFY PASSWORD OTP =================
// ======================================================

export const verifyPasswordOTP = async (req, res) => {

    const {
        email,
        otp
    } = req.body;

    try {

        const codes =
            await getLatestVerificationCode(
                email,
                "password_reset"
            );

        if (codes.length === 0) {

            return res.status(400).json({
                message:
                    "OTP not found"
            });

        }

        const otpData = codes[0];

        // Check expiry

        if (
            new Date() >
            new Date(otpData.expires_at)
        ) {

            return res.status(400).json({
                message:
                    "OTP expired"
            });

        }

        // Hash OTP

        const enteredHash =
            crypto
                .createHash("sha256")
                .update(otp)
                .digest("hex");

        // Compare

        if (
            enteredHash !==
            otpData.code_hash
        ) {

            return res.status(400).json({
                message:
                    "Invalid OTP"
            });

        }

        // Generate reset token

        const resetToken =
            crypto
                .randomBytes(32)
                .toString("hex");

        // Hash reset token

        const resetTokenHash =
            crypto
                .createHash("sha256")
                .update(resetToken)
                .digest("hex");

        // Reset token expires in 10 minutes

        const resetTokenExpires =
            new Date(
                Date.now() + 10 * 60 * 1000
            );

        // Save token

        await saveResetToken(
            email,
            resetTokenHash,
            resetTokenExpires
        );

        // Mark OTP used

        await markVerificationCodeUsed(
            otpData.id
        );

        res.json({

            message:
                "OTP verified successfully",

            resetToken

        });

    }
    catch (err) {

        console.log(
            "Password verify error:",
            err
        );

        res.status(500).json({
            message:
                "Server error"
        });

    }
};


// ======================================================
// ==================== RESET PASSWORD ===================
// ======================================================

export const resetPassword = async (req, res) => {

    const {
        email,
        resetToken,
        newPassword
    } = req.body;

    try {

        if (
            !email ||
            !resetToken ||
            !newPassword
        ) {

            return res.status(400).json({

                message:
                    "Email, reset token and new password are required"

            });

        }

        if (newPassword.length < 8) {

            return res.status(400).json({

                message:
                    "Password must be at least 8 characters"

            });

        }

        // Find user

        const users =
            await findUserByEmail(email);

        if (users.length === 0) {

            return res.status(404).json({
                message:
                    "User not found"
            });

        }

        const user = users[0];

        // Check reset token

        if (
            !user.reset_token_hash ||
            !user.reset_token_expires_at
        ) {

            return res.status(400).json({
                message:
                    "Invalid reset token"
            });

        }

        // Check expiry

        if (
            new Date() >
            new Date(
                user.reset_token_expires_at
            )
        ) {

            return res.status(400).json({
                message:
                    "Reset token expired"
            });

        }

        // Hash token

        const tokenHash =
            crypto
                .createHash("sha256")
                .update(resetToken)
                .digest("hex");

        // Compare

        if (
            tokenHash !==
            user.reset_token_hash
        ) {

            return res.status(400).json({
                message:
                    "Invalid reset token"
            });

        }

        // Hash new password

        const hashedPassword =
            await bcrypt.hash(
                newPassword,
                10
            );

        // Update password

        await resetUserPassword(
            email,
            hashedPassword
        );

        res.json({
            message:
                "Password reset successfully"
        });

    }
    catch (err) {

        console.log(
            "Password reset error:",
            err
        );

        res.status(500).json({
            message:
                "Server error"
        });

    }
};