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
} from "../controller/controller.js";

const router = express.Router();

router.get("/", home);

router.post("/user/create", registerUser);
router.post("/user/login", loginUser);

router.post("/otp/send", sendEmailOTP);
router.post("/otp/verify", verifyEmailOTP);

router.post("/password/forgot", forgotPassword);
router.post("/password/verify", verifyPasswordOTP);
router.post("/password/reset", resetPassword);

export default router;