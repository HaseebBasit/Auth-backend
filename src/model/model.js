import db from "../db/db.js";

// ======================================================
// ==================== USER MODELS ======================
// ======================================================

export const findUserByEmail = async (email) => {
    const result = await db.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
    );

    return result.rows;
};

export const createUser = async (
    name,
    email,
    hashedPassword
) => {
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

    return result.rows[0];
};

export const verifyUserEmail = async (email) => {
    await db.query(
        `UPDATE users
         SET is_verified = true
         WHERE email = $1`,
        [email]
    );
};

export const saveResetToken = async (
    email,
    resetTokenHash,
    resetTokenExpires
) => {
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
};

export const resetUserPassword = async (
    email,
    hashedPassword
) => {
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
};


// ======================================================
// ==================== OTP MODELS =======================
// ======================================================

export const saveVerificationCode = async (
    email,
    codeHash,
    purpose,
    expiresAt
) => {
    await db.query(
        `INSERT INTO verification_codes
        (email, code_hash, purpose, expires_at)
        VALUES ($1, $2, $3, $4)`,
        [
            email,
            codeHash,
            purpose,
            expiresAt
        ]
    );
};

export const getLatestVerificationCode = async (
    email,
    purpose
) => {
    const result = await db.query(
        `SELECT * FROM verification_codes
         WHERE email = $1
         AND purpose = $2
         AND used_at IS NULL
         ORDER BY created_at DESC
         LIMIT 1`,
        [
            email,
            purpose
        ]
    );

    return result.rows;
};

export const markVerificationCodeUsed = async (
    id
) => {
    await db.query(
        `UPDATE verification_codes
         SET used_at = NOW()
         WHERE id = $1`,
        [id]
    );
};