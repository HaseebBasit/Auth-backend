import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import db from "./src/db/db.js";

dotenv.config();

console.log("SMTP USER:", process.env.SMTP_USER);
console.log("SMTP PASSWORD EXISTS:", !!process.env.SMTP_PASSWORD);

const app = express();

app.use(cors());
app.use(express.json());


// ==================== EMAIL SETUP ====================

const transporter = nodemailer.createTransport({

    host: process.env.SMTP_HOST,

    port: Number(process.env.SMTP_PORT),

    secure: false,

    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }

});


// ==================== TEST ROUTE ====================

app.get("/", (req, res) => {

    res.send("Server is running!");

});


// ==================== CREATE USER ====================

app.post("/user/create", async (req, res) => {

    const { name, email, password } = req.body;

    try {

        // Check user already exists

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


// ==================== LOGIN ====================

app.post("/user/login", async (req, res) => {

    const { email, password } = req.body;

    try {

        // Find user

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


        // Check email verification

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


// ==================== SEND OTP ====================

app.post("/otp/send", async (req, res) => {

    const { email } = req.body;

    try {

        // ==================== CHECK USER ====================

        const userResult = await db.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (userResult.rows.length === 0) {

            return res.status(404).json({
                message: "User not found"
            });

        }


        // ==================== SECURE OTP ====================

        // Generate secure 6 digit OTP

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


        // ==================== SAVE OTP ====================

        await db.query(

            `INSERT INTO otp
            (email, code_hash, purpose, expires_at)
            VALUES ($1, $2, $3, $4)`,

            [
                email,
                codeHash,
                "email_verification",
                expiresAt
            ]

        );


        // ==================== SEND EMAIL ====================

        await transporter.sendMail({

            from: `"Your App" <${process.env.SMTP_FROM}>`,

            to: email,

            subject: "Email Verification OTP",

            html: `

                <div style="
                    font-family: Arial, sans-serif;
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

                    <p>
                        If you did not request this code,
                        you can ignore this email.
                    </p>

                </div>

            `

        });


        // ==================== SUCCESS ====================

        res.json({

            message: "OTP sent successfully"

        });


    } catch (err) {

        // ==================== ERROR ====================

        console.log("================================");
        console.log("SEND OTP ERROR");
        console.log("Message:", err.message);
        console.log("Code:", err.code);
        console.log("Response:", err.response);
        console.log("================================");


        res.status(500).json({

            message: "Failed to send OTP"

        });

    }

});

// ==================== VERIFY OTP ====================

app.post("/otp/verify", async (req, res) => {

    const { email, otp } = req.body;

    try {

        // Get latest unused OTP

        const result = await db.query(

            `SELECT * FROM otp
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


        // Compare OTP

        if (

            enteredHash !==

            otpData.code_hash

        ) {

            return res.status(400).json({

                message: "Invalid OTP"

            });

        }


        // Mark OTP as used

        await db.query(

            `UPDATE otp
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


// ==================== START SERVER ====================

app.listen(5050, () => {

    console.log(
        "Server is running on port 5050"
    );

});