// import bcrypt from "bcryptjs";
// import crypto from "crypto";
// import dotenv from "dotenv";
// import { Resend } from "resend";

// import {
//     findUserByEmail,
//     createUser,
//     verifyUserEmail,
//     saveResetToken,
//     resetUserPassword,
//     saveVerificationCode,
//     getLatestVerificationCode,
//     markVerificationCodeUsed
// } from "../model/model.js";

// dotenv.config();


// // ======================================================
// // ==================== RESEND SETUP ====================
// // ======================================================

// const resend = new Resend(
//     process.env.RESEND_API_KEY
// );


// // ======================================================
// // ==================== TEST CONTROLLER =================
// // ======================================================

// export const home = (req, res) => {
//     res.send("Server is running!");
// };


// // ======================================================
// // ==================== CREATE USER =====================
// // ======================================================

// export const registerUser = async (req, res) => {

//     const {
//         name,
//         email,
//         password
//     } = req.body;

//     try {

//         if (!name || !email || !password) {

//             return res.status(400).json({
//                 message:
//                     "Name, email and password are required"
//             });

//         }

//         if (password.length < 8) {

//             return res.status(400).json({
//                 message:
//                     "Password must be at least 8 characters"
//             });

//         }

//         const cleanEmail =
//             email.trim().toLowerCase();

//         // Check existing user

//         const existingUser =
//             await findUserByEmail(cleanEmail);

//         if (existingUser.length > 0) {

//             return res.status(400).json({
//                 message:
//                     "User already exists"
//             });

//         }

//         // Hash password

//         const hashedPassword =
//             await bcrypt.hash(
//                 password,
//                 10
//             );

//         // Create user

//         const user =
//             await createUser(
//                 name.trim(),
//                 cleanEmail,
//                 hashedPassword
//             );

//         res.status(201).json({

//             message:
//                 "User created successfully",

//             user

//         });

//     }
//     catch (err) {

//         console.log(
//             "CREATE USER ERROR:",
//             err
//         );

//         res.status(500).json({
//             message:
//                 "Server error"
//         });

//     }
// };


// // ======================================================
// // ==================== LOGIN ============================
// // ======================================================

// export const loginUser = async (req, res) => {

//     const {
//         email,
//         password
//     } = req.body;

//     try {

//         if (!email || !password) {

//             return res.status(400).json({
//                 message:
//                     "Email and password are required"
//             });

//         }

//         const cleanEmail =
//             email.trim().toLowerCase();

//         const users =
//             await findUserByEmail(
//                 cleanEmail
//             );

//         if (users.length === 0) {

//             return res.status(404).json({
//                 message:
//                     "User not found"
//             });

//         }

//         const user = users[0];

//         // Check password

//         const passwordMatch =
//             await bcrypt.compare(
//                 password,
//                 user.password
//             );

//         if (!passwordMatch) {

//             return res.status(401).json({
//                 message:
//                     "Invalid password"
//             });

//         }

//         // Check email verification

//         if (!user.is_verified) {

//             return res.status(403).json({
//                 message:
//                     "Please verify your email first"
//             });

//         }

//         res.json({

//             message:
//                 "Login successful",

//             user: {
//                 id: user.id,
//                 name: user.name,
//                 email: user.email
//             }

//         });

//     }
//     catch (err) {

//         console.log(
//             "LOGIN ERROR:",
//             err
//         );

//         res.status(500).json({
//             message:
//                 "Server error"
//         });

//     }
// };


// // ======================================================
// // ==================== SEND EMAIL OTP ==================
// // ======================================================

// export const sendEmailOTP = async (req, res) => {

//     const { email } = req.body;

//     try {

//         if (!email) {

//             return res.status(400).json({
//                 message:
//                     "Email is required"
//             });

//         }

//         const cleanEmail =
//             email.trim().toLowerCase();

//         // Check user

//         const users =
//             await findUserByEmail(
//                 cleanEmail
//             );

//         if (users.length === 0) {

//             return res.status(404).json({
//                 message:
//                     "User not found"
//             });

//         }

//         // If already verified

//         if (users[0].is_verified) {

//             return res.status(400).json({
//                 message:
//                     "Email is already verified"
//             });

//         }

//         // Generate OTP

//         const otp =
//             crypto
//                 .randomInt(
//                     100000,
//                     1000000
//                 )
//                 .toString();

//         // Hash OTP

//         const codeHash =
//             crypto
//                 .createHash("sha256")
//                 .update(otp)
//                 .digest("hex");

//         // OTP expires after 10 minutes

//         const expiresAt =
//             new Date(
//                 Date.now() +
//                 10 * 60 * 1000
//             );

//         // Save OTP in database

//         await saveVerificationCode(
//             cleanEmail,
//             codeHash,
//             "email_verification",
//             expiresAt
//         );

//         console.log(
//             "EMAIL OTP SAVED FOR:",
//             cleanEmail
//         );

//         // Send email using Resend

//         const { data, error } =
//             await resend.emails.send({

//                 from:
//                     process.env.RESEND_FROM_EMAIL,

//                 to:
//                     cleanEmail,

//                 subject:
//                     "Email Verification OTP",

//                 html: `
//                     <div style="
//                         font-family: Arial, sans-serif;
//                         max-width: 600px;
//                         margin: auto;
//                         padding: 30px;
//                         background: #f8fafc;
//                     ">

//                         <div style="
//                             background: white;
//                             padding: 30px;
//                             border-radius: 12px;
//                         ">

//                             <h2>
//                                 Email Verification
//                             </h2>

//                             <p>
//                                 Your verification OTP is:
//                             </p>

//                             <h1 style="
//                                 letter-spacing: 8px;
//                                 text-align: center;
//                                 font-size: 36px;
//                             ">
//                                 ${otp}
//                             </h1>

//                             <p>
//                                 This OTP will expire
//                                 in 10 minutes.
//                             </p>

//                             <p>
//                                 If you did not create
//                                 this account, you can
//                                 safely ignore this email.
//                             </p>

//                         </div>

//                     </div>
//                 `
//             });

//         if (error) {

//             console.log(
//                 "RESEND EMAIL ERROR:",
//                 error
//             );

//             return res.status(500).json({
//                 message:
//                     "OTP saved but email could not be sent"
//             });

//         }

//         console.log(
//             "VERIFICATION EMAIL SENT:",
//             data?.id
//         );

//         res.json({
//             message:
//                 "OTP sent successfully"
//         });

//     }
//     catch (err) {

//         console.log(
//             "SEND EMAIL OTP ERROR:",
//             err
//         );

//         res.status(500).json({
//             message:
//                 "Failed to send OTP"
//         });

//     }
// };


// // ======================================================
// // ==================== VERIFY EMAIL OTP ================
// // ======================================================

// export const verifyEmailOTP = async (req, res) => {

//     const {
//         email,
//         otp
//     } = req.body;

//     try {

//         if (!email || !otp) {

//             return res.status(400).json({
//                 message:
//                     "Email and OTP are required"
//             });

//         }

//         const cleanEmail =
//             email.trim().toLowerCase();

//         const cleanOtp =
//             otp.trim();

//         if (cleanOtp.length !== 6) {

//             return res.status(400).json({
//                 message:
//                     "OTP must be 6 digits"
//             });

//         }

//         const codes =
//             await getLatestVerificationCode(
//                 cleanEmail,
//                 "email_verification"
//             );

//         if (codes.length === 0) {

//             return res.status(400).json({
//                 message:
//                     "OTP not found"
//             });

//         }

//         const otpData = codes[0];

//         // Check expiry

//         if (
//             new Date() >
//             new Date(otpData.expires_at)
//         ) {

//             return res.status(400).json({
//                 message:
//                     "OTP expired"
//             });

//         }

//         // Hash entered OTP

//         const enteredHash =
//             crypto
//                 .createHash("sha256")
//                 .update(cleanOtp)
//                 .digest("hex");

//         // Compare OTP

//         if (
//             enteredHash !==
//             otpData.code_hash
//         ) {

//             return res.status(400).json({
//                 message:
//                     "Invalid OTP"
//             });

//         }

//         // Mark OTP as used

//         await markVerificationCodeUsed(
//             otpData.id
//         );

//         // Verify user

//         await verifyUserEmail(
//             cleanEmail
//         );

//         res.json({
//             message:
//                 "Email verified successfully"
//         });

//     }
//     catch (err) {

//         console.log(
//             "VERIFY EMAIL OTP ERROR:",
//             err
//         );

//         res.status(500).json({
//             message:
//                 "Server error"
//         });

//     }
// };


// // ======================================================
// // ==================== FORGOT PASSWORD =================
// // ======================================================

// export const forgotPassword = async (req, res) => {

//     const { email } = req.body;

//     try {

//         if (!email) {

//             return res.status(400).json({
//                 message:
//                     "Email is required"
//             });

//         }

//         const cleanEmail =
//             email.trim().toLowerCase();

//         // Check user

//         const users =
//             await findUserByEmail(
//                 cleanEmail
//             );

//         if (users.length === 0) {

//             return res.status(404).json({
//                 message:
//                     "User not found"
//             });

//         }

//         // Generate OTP

//         const otp =
//             crypto
//                 .randomInt(
//                     100000,
//                     1000000
//                 )
//                 .toString();

//         // Hash OTP

//         const codeHash =
//             crypto
//                 .createHash("sha256")
//                 .update(otp)
//                 .digest("hex");

//         // Expire after 10 minutes

//         const expiresAt =
//             new Date(
//                 Date.now() +
//                 10 * 60 * 1000
//             );

//         // Save reset OTP

//         await saveVerificationCode(
//             cleanEmail,
//             codeHash,
//             "password_reset",
//             expiresAt
//         );

//         console.log(
//             "PASSWORD RESET OTP SAVED FOR:",
//             cleanEmail
//         );

//         // Send reset email

//         const { data, error } =
//             await resend.emails.send({

//                 from:
//                     process.env.RESEND_FROM_EMAIL,

//                 to:
//                     cleanEmail,

//                 subject:
//                     "Password Reset OTP",

//                 html: `
//                     <div style="
//                         font-family: Arial, sans-serif;
//                         max-width: 600px;
//                         margin: auto;
//                         padding: 30px;
//                         background: #f8fafc;
//                     ">

//                         <div style="
//                             background: white;
//                             padding: 30px;
//                             border-radius: 12px;
//                         ">

//                             <h2>
//                                 Password Reset
//                             </h2>

//                             <p>
//                                 Your password reset
//                                 OTP is:
//                             </p>

//                             <h1 style="
//                                 letter-spacing: 8px;
//                                 text-align: center;
//                                 font-size: 36px;
//                             ">
//                                 ${otp}
//                             </h1>

//                             <p>
//                                 This OTP will expire
//                                 in 10 minutes.
//                             </p>

//                             <p>
//                                 If you did not request
//                                 a password reset, you
//                                 can safely ignore this
//                                 email.
//                             </p>

//                         </div>

//                     </div>
//                 `
//             });

//         if (error) {

//             console.log(
//                 "RESEND RESET EMAIL ERROR:",
//                 error
//             );

//             return res.status(500).json({
//                 message:
//                     "Reset OTP saved but email could not be sent"
//             });

//         }

//         console.log(
//             "PASSWORD RESET EMAIL SENT:",
//             data?.id
//         );

//         res.json({
//             message:
//                 "Password reset OTP sent successfully"
//         });

//     }
//     catch (err) {

//         console.log(
//             "FORGOT PASSWORD ERROR:",
//             err
//         );

//         res.status(500).json({
//             message:
//                 "Failed to send reset OTP"
//         });

//     }
// };


// // ======================================================
// // ================ VERIFY PASSWORD OTP =================
// // ======================================================

// export const verifyPasswordOTP = async (req, res) => {

//     const {
//         email,
//         otp
//     } = req.body;

//     try {

//         if (!email || !otp) {

//             return res.status(400).json({
//                 message:
//                     "Email and OTP are required"
//             });

//         }

//         const cleanEmail =
//             email.trim().toLowerCase();

//         const cleanOtp =
//             otp.trim();

//         const codes =
//             await getLatestVerificationCode(
//                 cleanEmail,
//                 "password_reset"
//             );

//         if (codes.length === 0) {

//             return res.status(400).json({
//                 message:
//                     "OTP not found"
//             });

//         }

//         const otpData = codes[0];

//         // Check expiry

//         if (
//             new Date() >
//             new Date(otpData.expires_at)
//         ) {

//             return res.status(400).json({
//                 message:
//                     "OTP expired"
//             });

//         }

//         // Hash OTP

//         const enteredHash =
//             crypto
//                 .createHash("sha256")
//                 .update(cleanOtp)
//                 .digest("hex");

//         // Compare

//         if (
//             enteredHash !==
//             otpData.code_hash
//         ) {

//             return res.status(400).json({
//                 message:
//                     "Invalid OTP"
//             });

//         }

//         // Generate reset token

//         const resetToken =
//             crypto
//                 .randomBytes(32)
//                 .toString("hex");

//         // Hash reset token

//         const resetTokenHash =
//             crypto
//                 .createHash("sha256")
//                 .update(resetToken)
//                 .digest("hex");

//         // Reset token expires in 10 minutes

//         const resetTokenExpires =
//             new Date(
//                 Date.now() +
//                 10 * 60 * 1000
//             );

//         // Save reset token

//         await saveResetToken(
//             cleanEmail,
//             resetTokenHash,
//             resetTokenExpires
//         );

//         // Mark OTP used

//         await markVerificationCodeUsed(
//             otpData.id
//         );

//         res.json({

//             message:
//                 "OTP verified successfully",

//             resetToken

//         });

//     }
//     catch (err) {

//         console.log(
//             "VERIFY PASSWORD OTP ERROR:",
//             err
//         );

//         res.status(500).json({
//             message:
//                 "Server error"
//         });

//     }
// };


// // ======================================================
// // ==================== RESET PASSWORD ==================
// // ======================================================

// export const resetPassword = async (req, res) => {

//     const {
//         email,
//         resetToken,
//         newPassword
//     } = req.body;

//     try {

//         if (
//             !email ||
//             !resetToken ||
//             !newPassword
//         ) {

//             return res.status(400).json({

//                 message:
//                     "Email, reset token and new password are required"

//             });

//         }

//         if (newPassword.length < 8) {

//             return res.status(400).json({

//                 message:
//                     "Password must be at least 8 characters"

//             });

//         }

//         const cleanEmail =
//             email.trim().toLowerCase();

//         // Find user

//         const users =
//             await findUserByEmail(
//                 cleanEmail
//             );

//         if (users.length === 0) {

//             return res.status(404).json({
//                 message:
//                     "User not found"
//             });

//         }

//         const user = users[0];

//         // Check reset token

//         if (
//             !user.reset_token_hash ||
//             !user.reset_token_expires_at
//         ) {

//             return res.status(400).json({
//                 message:
//                     "Invalid reset token"
//             });

//         }

//         // Check expiry

//         if (
//             new Date() >
//             new Date(
//                 user.reset_token_expires_at
//             )
//         ) {

//             return res.status(400).json({
//                 message:
//                     "Reset token expired"
//             });

//         }

//         // Hash token

//         const tokenHash =
//             crypto
//                 .createHash("sha256")
//                 .update(resetToken)
//                 .digest("hex");

//         // Compare

//         if (
//             tokenHash !==
//             user.reset_token_hash
//         ) {

//             return res.status(400).json({
//                 message:
//                     "Invalid reset token"
//             });

//         }

//         // Hash new password

//         const hashedPassword =
//             await bcrypt.hash(
//                 newPassword,
//                 10
//             );

//         // Update password

//         await resetUserPassword(
//             cleanEmail,
//             hashedPassword
//         );

//         res.json({
//             message:
//                 "Password reset successfully"
//         });

//     }
//     catch (err) {

//         console.log(
//             "RESET PASSWORD ERROR:",
//             err
//         );

//         res.status(500).json({
//             message:
//                 "Server error"
//         });

//     }
// };


import bcrypt from "bcryptjs";
import crypto from "crypto";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import dns from "dns";

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
// ==================== DNS / IPV4 =======================
// ======================================================

dns.setDefaultResultOrder("ipv4first");


// ======================================================
// ==================== EMAIL SETUP ======================
// ======================================================

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,

    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});


// Check SMTP connection
transporter.verify((error, success) => {
    if (error) {
        console.log("SMTP ERROR:", error);
    } else {
        console.log("SMTP SERVER READY");
    }
});


// ======================================================
// ======================== HOME =========================
// ======================================================

export const home = async (req, res) => {
    res.json({
        message: "Authentication API is running"
    });
};


// ======================================================
// ====================== REGISTER =======================
// ======================================================

export const registerUser = async (req, res) => {
    try {
        const {
            name,
            email,
            password
        } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters"
            });
        }

        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();

        // Check existing user
        const existingUsers = await findUserByEmail(cleanEmail);

        if (existingUsers.length > 0) {
            return res.status(400).json({
                message: "Email already registered"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(
            password,
            10
        );

        // Create user
        const user = await createUser(
            cleanName,
            cleanEmail,
            hashedPassword
        );

        return res.status(201).json({
            message: "User registered successfully",
            user
        });

    } catch (error) {
        console.error("REGISTER ERROR:", error);

        return res.status(500).json({
            message: "Server error during registration"
        });
    }
};


// ======================================================
// ======================== LOGIN ========================
// ======================================================

export const loginUser = async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        const users = await findUserByEmail(cleanEmail);

        if (users.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const user = users[0];

        // Check email verification
        if (!user.is_verified) {
            return res.status(403).json({
                message: "Please verify your email first"
            });
        }

        // Check password
        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        return res.status(200).json({
            message: "Login successful",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                is_verified: user.is_verified
            }
        });

    } catch (error) {
        console.error("LOGIN ERROR:", error);

        return res.status(500).json({
            message: "Server error during login"
        });
    }
};


// ======================================================
// ==================== SEND EMAIL OTP ==================
// ======================================================

export const sendEmailOTP = async (req, res) => {
    try {
        const {
            email
        } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required"
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        // Find user
        const users = await findUserByEmail(cleanEmail);

        if (users.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const user = users[0];

        // Already verified?
        if (user.is_verified) {
            return res.status(400).json({
                message: "Email is already verified"
            });
        }

        // Generate 6 digit OTP
        const otp = crypto
            .randomInt(100000, 1000000)
            .toString();

        // Hash OTP
        const codeHash = crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");

        // OTP expires after 10 minutes
        const expiresAt = new Date(
            Date.now() + 10 * 60 * 1000
        );

        // Save OTP
        await saveVerificationCode(
            cleanEmail,
            codeHash,
            "email_verification",
            expiresAt
        );

        // Send email
        await transporter.sendMail({
            from: `"Your App" <${process.env.SMTP_USER}>`,
            to: cleanEmail,
            subject: "Email Verification OTP",

            html: `
                <div style="
                    font-family: Arial, sans-serif;
                    max-width: 500px;
                    margin: auto;
                    padding: 30px;
                    border: 1px solid #ddd;
                    border-radius: 10px;
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
                        This OTP will expire in
                        <strong>10 minutes</strong>.
                    </p>

                    <p>
                        If you did not request this code,
                        please ignore this email.
                    </p>

                </div>
            `
        });

        return res.status(200).json({
            message: "OTP sent successfully"
        });

    } catch (error) {
        console.error("SEND EMAIL OTP ERROR:", error);

        return res.status(500).json({
            message: "Failed to send OTP",
            error: error.message
        });
    }
};


// ======================================================
// =================== VERIFY EMAIL OTP =================
// ======================================================

export const verifyEmailOTP = async (req, res) => {
    try {
        const {
            email,
            otp
        } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                message: "Email and OTP are required"
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        // Get latest OTP
        const codes = await getLatestVerificationCode(
            cleanEmail,
            "email_verification"
        );

        if (codes.length === 0) {
            return res.status(404).json({
                message: "OTP not found or already used"
            });
        }

        const otpData = codes[0];

        // Check expiry
        if (
            new Date(otpData.expires_at).getTime() <
            Date.now()
        ) {
            return res.status(400).json({
                message: "OTP has expired"
            });
        }

        // Hash entered OTP
        const enteredOtpHash = crypto
            .createHash("sha256")
            .update(otp.toString())
            .digest("hex");

        // Compare
        if (enteredOtpHash !== otpData.code_hash) {
            return res.status(400).json({
                message: "Invalid OTP"
            });
        }

        // Mark OTP as used
        await markVerificationCodeUsed(
            otpData.id
        );

        // Verify user
        await verifyUserEmail(
            cleanEmail
        );

        return res.status(200).json({
            message: "Email verified successfully"
        });

    } catch (error) {
        console.error("VERIFY EMAIL OTP ERROR:", error);

        return res.status(500).json({
            message: "Server error during OTP verification"
        });
    }
};


// ======================================================
// ==================== FORGOT PASSWORD =================
// ======================================================

export const forgotPassword = async (req, res) => {
    try {
        const {
            email
        } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required"
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        // Find user
        const users = await findUserByEmail(
            cleanEmail
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Generate OTP
        const otp = crypto
            .randomInt(100000, 1000000)
            .toString();

        // Hash OTP
        const codeHash = crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");

        // OTP expires in 10 minutes
        const expiresAt = new Date(
            Date.now() + 10 * 60 * 1000
        );

        // Save OTP
        await saveVerificationCode(
            cleanEmail,
            codeHash,
            "password_reset",
            expiresAt
        );

        // Send OTP email
        await transporter.sendMail({
            from: `"Your App" <${process.env.SMTP_USER}>`,
            to: cleanEmail,
            subject: "Password Reset OTP",

            html: `
                <div style="
                    font-family: Arial, sans-serif;
                    max-width: 500px;
                    margin: auto;
                    padding: 30px;
                    border: 1px solid #ddd;
                    border-radius: 10px;
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
                        This OTP will expire in
                        <strong>10 minutes</strong>.
                    </p>

                    <p>
                        If you did not request a password reset,
                        please ignore this email.
                    </p>

                </div>
            `
        });

        return res.status(200).json({
            message: "Password reset OTP sent successfully"
        });

    } catch (error) {
        console.error("FORGOT PASSWORD ERROR:", error);

        return res.status(500).json({
            message: "Failed to send password reset OTP",
            error: error.message
        });
    }
};


// ======================================================
// ================= VERIFY PASSWORD OTP ================
// ======================================================

export const verifyPasswordOTP = async (req, res) => {
    try {
        const {
            email,
            otp
        } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                message: "Email and OTP are required"
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        // Get latest password reset OTP
        const codes = await getLatestVerificationCode(
            cleanEmail,
            "password_reset"
        );

        if (codes.length === 0) {
            return res.status(404).json({
                message: "OTP not found or already used"
            });
        }

        const otpData = codes[0];

        // Check expiry
        if (
            new Date(otpData.expires_at).getTime() <
            Date.now()
        ) {
            return res.status(400).json({
                message: "OTP has expired"
            });
        }

        // Hash entered OTP
        const enteredOtpHash = crypto
            .createHash("sha256")
            .update(otp.toString())
            .digest("hex");

        // Compare OTP
        if (
            enteredOtpHash !== otpData.code_hash
        ) {
            return res.status(400).json({
                message: "Invalid OTP"
            });
        }

        // Generate reset token
        const resetToken = crypto
            .randomBytes(32)
            .toString("hex");

        // Hash reset token before saving
        const resetTokenHash = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        // Reset token expires in 10 minutes
        const resetTokenExpires = new Date(
            Date.now() + 10 * 60 * 1000
        );

        // Save reset token
        await saveResetToken(
            cleanEmail,
            resetTokenHash,
            resetTokenExpires
        );

        // Mark OTP used
        await markVerificationCodeUsed(
            otpData.id
        );

        return res.status(200).json({
            message: "OTP verified successfully",
            resetToken
        });

    } catch (error) {
        console.error("VERIFY PASSWORD OTP ERROR:", error);

        return res.status(500).json({
            message: "Server error during password OTP verification"
        });
    }
};


// ======================================================
// ==================== RESET PASSWORD ==================
// ======================================================

export const resetPassword = async (req, res) => {
    try {
        const {
            email,
            resetToken,
            newPassword
        } = req.body;

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
                    "New password must be at least 8 characters"
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        // Find user
        const users = await findUserByEmail(
            cleanEmail
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const user = users[0];

        // Check reset token exists
        if (
            !user.reset_token_hash ||
            !user.reset_token_expires_at
        ) {
            return res.status(400).json({
                message: "Invalid or expired reset token"
            });
        }

        // Check expiry
        if (
            new Date(
                user.reset_token_expires_at
            ).getTime() < Date.now()
        ) {
            return res.status(400).json({
                message: "Reset token has expired"
            });
        }

        // Hash received token
        const resetTokenHash = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        // Compare
        if (
            resetTokenHash !==
            user.reset_token_hash
        ) {
            return res.status(400).json({
                message: "Invalid reset token"
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(
            newPassword,
            10
        );

        // Update password
        await resetUserPassword(
            cleanEmail,
            hashedPassword
        );

        return res.status(200).json({
            message: "Password reset successfully"
        });

    } catch (error) {
        console.error("RESET PASSWORD ERROR:", error);

        return res.status(500).json({
            message: "Server error during password reset"
        });
    }
};