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
// ==================== EMAIL SETUP ======================
// ======================================================

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    family: 4,

    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,

    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
});


// Check SMTP connection
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

        const cleanEmail =
            email.trim().toLowerCase();

        if (password.length < 8) {

            return res.status(400).json({
                message:
                    "Password must be at least 8 characters"
            });

        }


        // ==================================================
        // CHECK EXISTING USER
        // ==================================================

        const existingUser =
            await findUserByEmail(cleanEmail);

        if (existingUser.length > 0) {

            return res.status(400).json({
                message:
                    "User already exists"
            });

        }


        // ==================================================
        // HASH PASSWORD
        // ==================================================

        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );


        // ==================================================
        // CREATE USER
        // ==================================================

        const user =
            await createUser(
                name.trim(),
                cleanEmail,
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
            "CREATE USER ERROR:",
            err
        );

        res.status(500).json({
            message:
                "Server error"
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

        if (!email || !password) {

            return res.status(400).json({
                message:
                    "Email and password are required"
            });

        }

        const cleanEmail =
            email.trim().toLowerCase();


        // ==================================================
        // FIND USER
        // ==================================================

        const users =
            await findUserByEmail(
                cleanEmail
            );

        if (users.length === 0) {

            return res.status(404).json({
                message:
                    "User not found"
            });

        }

        const user = users[0];


        // ==================================================
        // CHECK PASSWORD
        // ==================================================

        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!passwordMatch) {

            return res.status(401).json({
                message:
                    "Invalid password"
            });

        }


        // ==================================================
        // CHECK EMAIL VERIFICATION
        // ==================================================

        if (!user.is_verified) {

            return res.status(403).json({
                message:
                    "Please verify your email first"
            });

        }


        // ==================================================
        // LOGIN SUCCESS
        // ==================================================

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
            "LOGIN ERROR:",
            err
        );

        res.status(500).json({
            message:
                "Server error"
        });

    }

};


// ======================================================
// ==================== SEND EMAIL OTP ===================
// ======================================================

export const sendEmailOTP = async (req, res) => {

    const { email } = req.body;

    try {

        if (!email) {

            return res.status(400).json({
                message:
                    "Email is required"
            });

        }

        const cleanEmail =
            email.trim().toLowerCase();


        console.log(
            "OTP REQUEST RECEIVED:",
            cleanEmail
        );


        // ==================================================
        // CHECK USER
        // ==================================================

        const users =
            await findUserByEmail(
                cleanEmail
            );

        if (users.length === 0) {

            return res.status(404).json({
                message:
                    "User not found"
            });

        }


        // ==================================================
        // CHECK IF ALREADY VERIFIED
        // ==================================================

        if (users[0].is_verified) {

            return res.status(400).json({
                message:
                    "Email is already verified"
            });

        }


        // ==================================================
        // GENERATE OTP
        // ==================================================

        const otp =
            crypto
                .randomInt(
                    100000,
                    1000000
                )
                .toString();

        console.log(
            "OTP GENERATED FOR:",
            cleanEmail
        );


        // ==================================================
        // HASH OTP
        // ==================================================

        const codeHash =
            crypto
                .createHash("sha256")
                .update(otp)
                .digest("hex");


        // ==================================================
        // OTP EXPIRY
        // ==================================================

        const expiresAt =
            new Date(
                Date.now() +
                10 * 60 * 1000
            );


        // ==================================================
        // SAVE OTP TO DATABASE
        // ==================================================

        console.log(
            "SAVING EMAIL OTP TO DATABASE..."
        );

        await saveVerificationCode(
            cleanEmail,
            codeHash,
            "email_verification",
            expiresAt
        );

        console.log(
            "EMAIL OTP SAVED TO DATABASE"
        );


        // ==================================================
        // CHECK SMTP CONFIG
        // ==================================================

        if (
            !process.env.SMTP_USER ||
            !process.env.SMTP_PASSWORD ||
            !process.env.SMTP_FROM
        ) {

            console.log(
                "SMTP ENV VARIABLES ARE MISSING"
            );

            return res.status(500).json({
                message:
                    "SMTP configuration is missing"
            });

        }


        // ==================================================
        // SEND EMAIL
        // ==================================================

        console.log(
            "SENDING EMAIL OTP..."
        );

        await transporter.sendMail({

            from:
                `"SecureAuth" <${process.env.SMTP_FROM}>`,

            to:
                cleanEmail,

            subject:
                "Email Verification OTP",

            html: `
                <div style="
                    font-family: Arial, sans-serif;
                    background: #f4f4f4;
                    padding: 40px;
                ">

                    <div style="
                        max-width: 500px;
                        margin: auto;
                        background: white;
                        padding: 30px;
                        border-radius: 12px;
                    ">

                        <h2 style="
                            color: #111827;
                        ">
                            Email Verification
                        </h2>

                        <p>
                            Your verification OTP is:
                        </p>

                        <h1 style="
                            letter-spacing: 10px;
                            text-align: center;
                            color: #4f46e5;
                        ">
                            ${otp}
                        </h1>

                        <p>
                            This OTP will expire
                            in 10 minutes.
                        </p>

                        <p style="
                            color: #666;
                            font-size: 13px;
                        ">
                            If you did not create this
                            account, you can ignore
                            this email.
                        </p>

                    </div>

                </div>
            `

        });

        console.log(
            "EMAIL OTP SENT SUCCESSFULLY"
        );


        // ==================================================
        // RESPONSE
        // ==================================================

        res.json({

            message:
                "OTP sent successfully"

        });

    }
    catch (err) {

        console.log(
            "SEND EMAIL OTP ERROR:",
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

        if (!email || !otp) {

            return res.status(400).json({
                message:
                    "Email and OTP are required"
            });

        }

        const cleanEmail =
            email.trim().toLowerCase();

        const cleanOtp =
            otp.trim();


        // ==================================================
        // GET LATEST OTP
        // ==================================================

        const codes =
            await getLatestVerificationCode(
                cleanEmail,
                "email_verification"
            );

        if (codes.length === 0) {

            return res.status(400).json({
                message:
                    "OTP not found or already used"
            });

        }

        const otpData = codes[0];


        // ==================================================
        // CHECK EXPIRY
        // ==================================================

        if (
            new Date() >
            new Date(otpData.expires_at)
        ) {

            return res.status(400).json({
                message:
                    "OTP expired"
            });

        }


        // ==================================================
        // HASH ENTERED OTP
        // ==================================================

        const enteredHash =
            crypto
                .createHash("sha256")
                .update(cleanOtp)
                .digest("hex");


        // ==================================================
        // COMPARE OTP
        // ==================================================

        if (
            enteredHash !==
            otpData.code_hash
        ) {

            return res.status(400).json({
                message:
                    "Invalid OTP"
            });

        }


        // ==================================================
        // MARK OTP USED
        // ==================================================

        await markVerificationCodeUsed(
            otpData.id
        );


        // ==================================================
        // VERIFY USER
        // ==================================================

        await verifyUserEmail(
            cleanEmail
        );


        res.json({

            message:
                "Email verified successfully"

        });

    }
    catch (err) {

        console.log(
            "VERIFY EMAIL OTP ERROR:",
            err
        );

        res.status(500).json({
            message:
                "Server error"
        });

    }

};


// ======================================================
// ==================== FORGOT PASSWORD ==================
// ======================================================

export const forgotPassword = async (req, res) => {

    const { email } = req.body;

    try {

        if (!email) {

            return res.status(400).json({
                message:
                    "Email is required"
            });

        }

        const cleanEmail =
            email.trim().toLowerCase();


        console.log(
            "PASSWORD RESET REQUEST:",
            cleanEmail
        );


        // ==================================================
        // CHECK USER
        // ==================================================

        const users =
            await findUserByEmail(
                cleanEmail
            );

        if (users.length === 0) {

            return res.status(404).json({
                message:
                    "User not found"
            });

        }


        // ==================================================
        // GENERATE OTP
        // ==================================================

        const otp =
            crypto
                .randomInt(
                    100000,
                    1000000
                )
                .toString();


        console.log(
            "PASSWORD RESET OTP GENERATED"
        );


        // ==================================================
        // HASH OTP
        // ==================================================

        const codeHash =
            crypto
                .createHash("sha256")
                .update(otp)
                .digest("hex");


        // ==================================================
        // EXPIRY
        // ==================================================

        const expiresAt =
            new Date(
                Date.now() +
                10 * 60 * 1000
            );


        // ==================================================
        // SAVE RESET OTP
        // ==================================================

        console.log(
            "SAVING PASSWORD RESET OTP..."
        );

        await saveVerificationCode(
            cleanEmail,
            codeHash,
            "password_reset",
            expiresAt
        );

        console.log(
            "PASSWORD RESET OTP SAVED"
        );


        // ==================================================
        // CHECK SMTP CONFIG
        // ==================================================

        if (
            !process.env.SMTP_USER ||
            !process.env.SMTP_PASSWORD ||
            !process.env.SMTP_FROM
        ) {

            return res.status(500).json({
                message:
                    "SMTP configuration is missing"
            });

        }


        // ==================================================
        // SEND RESET EMAIL
        // ==================================================

        console.log(
            "SENDING PASSWORD RESET EMAIL..."
        );

        await transporter.sendMail({

            from:
                `"SecureAuth" <${process.env.SMTP_FROM}>`,

            to:
                cleanEmail,

            subject:
                "Password Reset OTP",

            html: `
                <div style="
                    font-family: Arial, sans-serif;
                    background: #f4f4f4;
                    padding: 40px;
                ">

                    <div style="
                        max-width: 500px;
                        margin: auto;
                        background: white;
                        padding: 30px;
                        border-radius: 12px;
                    ">

                        <h2>
                            Password Reset
                        </h2>

                        <p>
                            Your password reset OTP is:
                        </p>

                        <h1 style="
                            letter-spacing: 10px;
                            text-align: center;
                            color: #4f46e5;
                        ">
                            ${otp}
                        </h1>

                        <p>
                            This OTP will expire
                            in 10 minutes.
                        </p>

                        <p style="
                            color: #666;
                            font-size: 13px;
                        ">
                            If you did not request
                            a password reset, you can
                            safely ignore this email.
                        </p>

                    </div>

                </div>
            `

        });

        console.log(
            "PASSWORD RESET EMAIL SENT"
        );


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

        if (!email || !otp) {

            return res.status(400).json({
                message:
                    "Email and OTP are required"
            });

        }

        const cleanEmail =
            email.trim().toLowerCase();

        const cleanOtp =
            otp.trim();


        // ==================================================
        // GET LATEST RESET OTP
        // ==================================================

        const codes =
            await getLatestVerificationCode(
                cleanEmail,
                "password_reset"
            );

        if (codes.length === 0) {

            return res.status(400).json({
                message:
                    "OTP not found or already used"
            });

        }

        const otpData = codes[0];


        // ==================================================
        // CHECK EXPIRY
        // ==================================================

        if (
            new Date() >
            new Date(otpData.expires_at)
        ) {

            return res.status(400).json({
                message:
                    "OTP expired"
            });

        }


        // ==================================================
        // HASH OTP
        // ==================================================

        const enteredHash =
            crypto
                .createHash("sha256")
                .update(cleanOtp)
                .digest("hex");


        // ==================================================
        // COMPARE
        // ==================================================

        if (
            enteredHash !==
            otpData.code_hash
        ) {

            return res.status(400).json({
                message:
                    "Invalid OTP"
            });

        }


        // ==================================================
        // GENERATE RESET TOKEN
        // ==================================================

        const resetToken =
            crypto
                .randomBytes(32)
                .toString("hex");


        // ==================================================
        // HASH RESET TOKEN
        // ==================================================

        const resetTokenHash =
            crypto
                .createHash("sha256")
                .update(resetToken)
                .digest("hex");


        // ==================================================
        // RESET TOKEN EXPIRY
        // ==================================================

        const resetTokenExpires =
            new Date(
                Date.now() +
                10 * 60 * 1000
            );


        // ==================================================
        // SAVE RESET TOKEN
        // ==================================================

        await saveResetToken(
            cleanEmail,
            resetTokenHash,
            resetTokenExpires
        );


        // ==================================================
        // MARK OTP USED
        // ==================================================

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
            "PASSWORD VERIFY ERROR:",
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

        const cleanEmail =
            email.trim().toLowerCase();


        // ==================================================
        // FIND USER
        // ==================================================

        const users =
            await findUserByEmail(
                cleanEmail
            );

        if (users.length === 0) {

            return res.status(404).json({

                message:
                    "User not found"

            });

        }

        const user = users[0];


        // ==================================================
        // CHECK RESET TOKEN
        // ==================================================

        if (
            !user.reset_token_hash ||
            !user.reset_token_expires_at
        ) {

            return res.status(400).json({

                message:
                    "Invalid reset token"

            });

        }


        // ==================================================
        // CHECK TOKEN EXPIRY
        // ==================================================

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


        // ==================================================
        // HASH RESET TOKEN
        // ==================================================

        const tokenHash =
            crypto
                .createHash("sha256")
                .update(resetToken)
                .digest("hex");


        // ==================================================
        // COMPARE TOKEN
        // ==================================================

        if (
            tokenHash !==
            user.reset_token_hash
        ) {

            return res.status(400).json({

                message:
                    "Invalid reset token"

            });

        }


        // ==================================================
        // HASH NEW PASSWORD
        // ==================================================

        const hashedPassword =
            await bcrypt.hash(
                newPassword,
                10
            );


        // ==================================================
        // UPDATE PASSWORD
        // ==================================================

        await resetUserPassword(
            cleanEmail,
            hashedPassword
        );


        res.json({

            message:
                "Password reset successfully"

        });

    }
    catch (err) {

        console.log(
            "PASSWORD RESET ERROR:",
            err
        );

        res.status(500).json({

            message:
                "Server error"

        });

    }

};