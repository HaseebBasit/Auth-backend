import express from "express";

import {
    home,
    registerUser,
    loginUser,
    sendEmailOTP,
    verifyEmailOTP,
    forgotPassword,
    verifyPasswordOTP,
    resetPassword,
    getCurrentUser,
    logoutUser  
} from "../controller/controller.js";

const router = express.Router();


// ======================================================
// ==================== TEST ROUTE ======================
// ======================================================

router.get("/", home);


// ======================================================
// ==================== USER ROUTES ======================
// ======================================================

router.post(
    "/user/create",
    registerUser
);

router.post(
    "/user/login",
    loginUser
);


// ======================================================
// ==================== EMAIL OTP ROUTES =================
// ======================================================

router.post(
    "/otp/send",
    sendEmailOTP
);

router.post(
    "/otp/verify",
    verifyEmailOTP
);


// ======================================================
// ==================== PASSWORD ROUTES ===================
// ======================================================

router.post(
    "/password/forgot",
    forgotPassword
);

router.post(
    "/password/verify",
    verifyPasswordOTP
);

router.post(
    "/password/reset",
    resetPassword
);

router.get("/auth/me", getCurrentUser);

router.post("/auth/logout", logoutUser);

export default router;