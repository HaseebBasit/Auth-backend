import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import db from "./src/db/db.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: [
      'https://auth-frontend-three-omega.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());



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
transporter.verify((error, success) => {
    if (error) {
        console.log("SMTP CONNECTION ERROR:", error);
    } else {
        console.log("SMTP SERVER IS READY");
    }
});


// ======================================================
// ==================== TEST ROUTE ======================
// ======================================================

app.get("/", (req, res) => {

    res.send("Server is running!");

});


// ======================================================
// ==================== CREATE USER =====================
// ======================================================

app.post("/user/create", async (req, res) => {

    const { name, email, password } = req.body;

    try {

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


        // Check existing user

        const userCheck = await db.query(

            "SELECT * FROM users WHERE email = $1",

            [email]

        );


        if (userCheck.rows.length > 0) {

            return res.status(400).json({

                message: "User already exists"

            });

        }


        // Hash password

        const hashedPassword = await bcrypt.hash(

            password,

            10

        );


        // Create user

        const result = await db.query(

            `INSERT INTO users
            (name, email, password, is_verified)
            VALUES ($1, $2, $3, $4)
            RETURNING id, name, email, is_verified, created_at`,

            [
                name,
                email,
                hashedPassword,
                false
            ]

        );


        res.status(201).json({

            message: "User created successfully",

            user: result.rows[0]

        });

    }

    catch (err) {

        console.log("Create user error:", err);

        res.status(500).json({

            message: "Server error"

        });

    }

});


// ======================================================
// ==================== LOGIN ============================
// ======================================================

app.post("/user/login", async (req, res) => {

    const { email, password } = req.body;

    try {

        const result = await db.query(

            "SELECT * FROM users WHERE email = $1",

            [email]

        );


        if (result.rows.length === 0) {

            return res.status(404).json({

                message: "User not found"

            });

        }


        const user = result.rows[0];


        // Check password

        const passwordMatch = await bcrypt.compare(

            password,

            user.password

        );


        if (!passwordMatch) {

            return res.status(401).json({

                message: "Invalid password"

            });

        }


        // Check verification

        if (!user.is_verified) {

            return res.status(403).json({

                message: "Please verify your email first"

            });

        }


        res.json({

            message: "Login successful",

            user: {

                id: user.id,

                name: user.name,

                email: user.email

            }

        });

    }

    catch (err) {

        console.log("Login error:", err);

        res.status(500).json({

            message: "Server error"

        });

    }

});


// ======================================================
// ==================== SEND EMAIL OTP ===================
// ======================================================

app.post("/otp/send", async (req, res) => {

    const { email } = req.body;

    try {

        // Check user

        const userResult = await db.query(

            "SELECT * FROM users WHERE email = $1",

            [email]

        );


        if (userResult.rows.length === 0) {

            return res.status(404).json({

                message: "User not found"

            });

        }


        // Generate secure OTP

        const otp = crypto
            .randomInt(100000, 1000000)
            .toString();


        // Hash OTP

        const codeHash = crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");


        // Expire after 10 minutes

        const expiresAt = new Date(

            Date.now() + 10 * 60 * 1000

        );


        // Save OTP

        await db.query(

            `INSERT INTO verification_codes
            (email, code_hash, purpose, expires_at)
            VALUES ($1, $2, $3, $4)`,

            [
                email,
                codeHash,
                "email_verification",
                expiresAt
            ]

        );


        // Send email

        await transporter.sendMail({

            from: `"Your App" <${process.env.SMTP_FROM}>`,

            to: email,

            subject: "Email Verification OTP",

            html: `

                <div style="
                    font-family: Arial;
                    padding: 30px;
                ">

                    <h2>Email Verification</h2>

                    <p>Your verification OTP is:</p>

                    <h1 style="
                        letter-spacing: 8px;
                        text-align: center;
                    ">
                        ${otp}
                    </h1>

                    <p>
                        This OTP will expire in 10 minutes.
                    </p>

                </div>

            `

        });


        res.json({

            message: "OTP sent successfully"

        });

    }

    catch (err) {

        console.log("SEND OTP ERROR:", err);

        res.status(500).json({

            message: "Failed to send OTP"

        });

    }

});


// ======================================================
// ==================== VERIFY EMAIL OTP ================
// ======================================================

app.post("/otp/verify", async (req, res) => {

    const { email, otp } = req.body;

    try {

        // Get latest verification OTP

        const result = await db.query(

            `SELECT * FROM verification_codes
             WHERE email = $1
             AND purpose = $2
             AND used_at IS NULL
             ORDER BY created_at DESC
             LIMIT 1`,

            [
                email,
                "email_verification"
            ]

        );


        if (result.rows.length === 0) {

            return res.status(400).json({

                message: "OTP not found"

            });

        }


        const otpData = result.rows[0];


        // Check expiry

        if (

            new Date() >

            new Date(otpData.expires_at)

        ) {

            return res.status(400).json({

                message: "OTP expired"

            });

        }


        // Hash entered OTP

        const enteredHash = crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");


        // Compare

        if (

            enteredHash !==

            otpData.code_hash

        ) {

            return res.status(400).json({

                message: "Invalid OTP"

            });

        }


        // Mark OTP used

        await db.query(

            `UPDATE verification_codes
             SET used_at = NOW()
             WHERE id = $1`,

            [otpData.id]

        );


        // Verify user

        await db.query(

            `UPDATE users
             SET is_verified = true
             WHERE email = $1`,

            [email]

        );


        res.json({

            message: "Email verified successfully"

        });

    }

    catch (err) {

        console.log("Verify OTP error:", err);

        res.status(500).json({

            message: "Server error"

        });

    }

});


// ======================================================
// ==================== FORGOT PASSWORD ==================
// ======================================================

app.post("/password/forgot", async (req, res) => {

    const { email } = req.body;

    try {

        // Check user

        const userResult = await db.query(

            "SELECT * FROM users WHERE email = $1",

            [email]

        );


        if (userResult.rows.length === 0) {

            return res.status(404).json({

                message: "User not found"

            });

        }


        // Generate secure OTP

        const otp = crypto
            .randomInt(100000, 1000000)
            .toString();


        // Hash OTP

        const codeHash = crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");


        // Expire after 10 minutes

        const expiresAt = new Date(

            Date.now() + 10 * 60 * 1000

        );


        // Save password reset OTP

        await db.query(

            `INSERT INTO verification_codes
            (email, code_hash, purpose, expires_at)
            VALUES ($1, $2, $3, $4)`,

            [
                email,
                codeHash,
                "password_reset",
                expiresAt
            ]

        );


        // Send email

        await transporter.sendMail({

            from: `"Your App" <${process.env.SMTP_FROM}>`,

            to: email,

            subject: "Password Reset OTP",

            html: `

                <div style="
                    font-family: Arial;
                    padding: 30px;
                ">

                    <h2>Password Reset</h2>

                    <p>Your password reset OTP is:</p>

                    <h1 style="
                        letter-spacing: 8px;
                        text-align: center;
                    ">
                        ${otp}
                    </h1>

                    <p>
                        This OTP will expire in 10 minutes.
                    </p>

                </div>

            `

        });


        res.json({

            message: "Password reset OTP sent successfully"

        });

    }

    catch (err) {

        console.log("FORGOT PASSWORD ERROR:", err);

        res.status(500).json({

            message: "Failed to send reset OTP"

        });

    }

});


// ======================================================
// ================ VERIFY PASSWORD OTP =================
// ======================================================

app.post("/password/verify", async (req, res) => {

    const { email, otp } = req.body;

    try {

        // Get latest reset OTP

        const result = await db.query(

            `SELECT * FROM verification_codes
             WHERE email = $1
             AND purpose = $2
             AND used_at IS NULL
             ORDER BY created_at DESC
             LIMIT 1`,

            [
                email,
                "password_reset"
            ]

        );


        if (result.rows.length === 0) {

            return res.status(400).json({

                message: "OTP not found"

            });

        }


        const otpData = result.rows[0];


        // Check expiry

        if (

            new Date() >

            new Date(otpData.expires_at)

        ) {

            return res.status(400).json({

                message: "OTP expired"

            });

        }


        // Hash entered OTP

        const enteredHash = crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");


        // Compare OTP

        if (

            enteredHash !==

            otpData.code_hash

        ) {

            return res.status(400).json({

                message: "Invalid OTP"

            });

        }


        // Generate secure reset token

        const resetToken = crypto
            .randomBytes(32)
            .toString("hex");


        // Hash reset token

        const resetTokenHash = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");


        // Reset token expires after 10 minutes

        const resetTokenExpires = new Date(

            Date.now() + 10 * 60 * 1000

        );


        // Save reset token hash

        await db.query(

            `UPDATE users
             SET reset_token_hash = $1,
                 reset_token_expires_at = $2
             WHERE email = $3`,

            [
                resetTokenHash,
                resetTokenExpires,
                email
            ]

        );


        // Mark OTP as used

        await db.query(

            `UPDATE verification_codes
             SET used_at = NOW()
             WHERE id = $1`,

            [otpData.id]

        );


        res.json({

            message: "OTP verified successfully",

            resetToken: resetToken

        });

    }

    catch (err) {

        console.log("Password verify error:", err);

        res.status(500).json({

            message: "Server error"

        });

    }

});


// ======================================================
// ==================== RESET PASSWORD ===================
// ======================================================

app.post("/password/reset", async (req, res) => {

    const {
        email,
        resetToken,
        newPassword
    } = req.body;

    try {

        if (!email || !resetToken || !newPassword) {

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

        const userResult = await db.query(

            "SELECT * FROM users WHERE email = $1",

            [email]

        );


        if (userResult.rows.length === 0) {

            return res.status(404).json({

                message: "User not found"

            });

        }


        const user = userResult.rows[0];


        // Check reset token

        if (

            !user.reset_token_hash ||

            !user.reset_token_expires_at

        ) {

            return res.status(400).json({

                message: "Invalid reset token"

            });

        }


        // Check token expiry

        if (

            new Date() >

            new Date(user.reset_token_expires_at)

        ) {

            return res.status(400).json({

                message: "Reset token expired"

            });

        }


        // Hash token

        const tokenHash = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");


        // Compare token

        if (

            tokenHash !==

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

        await db.query(

            `UPDATE users
             SET password = $1,
                 reset_token_hash = NULL,
                 reset_token_expires_at = NULL
             WHERE email = $2`,

            [
                hashedPassword,
                email
            ]

        );


        res.json({

            message: "Password reset successfully"

        });

    }

    catch (err) {

        console.log("Password reset error:", err);

        res.status(500).json({

            message: "Server error"

        });

    }

});


// ======================================================
// ==================== START SERVER ====================
// ======================================================

const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});