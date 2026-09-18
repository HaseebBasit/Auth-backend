import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import routes from "./src/routes/routes.js";

dotenv.config();

const app = express();


// ======================================================
// ==================== MIDDLEWARE =======================
// ======================================================

app.use(
    cors({
        origin: [
            "https://auth-frontend-three-omega.vercel.app",
            "http://localhost:5173",
            "http://localhost:3000"
        ],
        methods: [
            "GET",
            "POST",
            "PUT",
            "DELETE",
            "OPTIONS"
        ],
        allowedHeaders: [
            "Content-Type",
            "Authorization"
        ]
    })
);

app.use(express.json());


// ======================================================
// ==================== ROUTES ===========================
// ======================================================

app.use("/", routes);


// ======================================================
// ==================== START SERVER =====================
// ======================================================

const PORT =
    process.env.PORT || 5050;

app.listen(PORT, () => {

    console.log(
        `Server is running on port ${PORT}`
    );

});