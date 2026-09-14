import express from "express";
import morgan from "morgan";
import cors from "cors";
import pool from "./src/db/db.js";

const port = 5050;
const server = express();

server.use(cors());
server.use(morgan("dev"));
server.use(express.json());


// Add user
server.post("/user/add", async (req, res) => {
    const { username, email, age } = req.body;

    console.log("Body:", username, email, age);

    try {
        const addQuery = `
            INSERT INTO users(username, email, age)
            VALUES($1, $2, $3)
            RETURNING *
        `;

        const apiRes = await pool.query(
            addQuery,
            [username, email, age]
        );

        console.log("Res:", apiRes.rows);

        return res.status(200).send({
            status: true,
            message: "User Added",
            data: apiRes.rows[0]
        });

    } catch (error) {
        console.log("Err while adding data:", error);

        return res.status(500).send({
            status: false,
            message: "User failed to add",
            error: error.message
        });
    }
});


// Fetch all users
server.get("/user/fetch/all", async (req, res) => {
    try {
        const apiRes = await pool.query("SELECT * FROM users");

        console.log("Res:", apiRes.rows);

        return res.status(200).send({
            status: true,
            message: "Users",
            data: apiRes.rows
        });

    } catch (error) {
        console.log("Err while fetching users data:", error);

        return res.status(500).send({
            status: false,
            message: "Internal server error!",
            error: error.message
        });
    }
});

// Update user
server.put("/user/update", async (req, res) => {
    const { id, username, email, age } = req.body;

    try {
        const apiRes = await pool.query(
            `UPDATE users SET
                username = $1,
                email = $2,
                age = $3
             WHERE id = $4
             RETURNING *`,
            [username, email, age, id]
        );

        console.log("Api res:", apiRes.rows);

        if (apiRes.rows.length === 0) {
            return res.status(404).send({
                status: false,
                message: "User not found"
            });
        }

        return res.status(200).send({
            status: true,
            message: "User updated",
            data: apiRes.rows[0]
        });

    } catch (error) {
        console.log("Err while updating user:", error);

        return res.status(500).send({
            status: false,
            message: "Internal server error!",
            error: error.message
        });
    }
});

// fetch data by ID 
server.get("/user/fetch/:uid", async (req, res) => {
    const {uid}=req.params;
    console.log("uid:",uid);

    try {
        const apiRes = await pool.query(
            `SELECT * FROM users WHERE id=$1`,
            [uid],
        );

        console.log("Api res:", apiRes);

        if (apiRes.rows.length === 0) {
            return res.status(404).send({
                status: false,
                message: "User not found"
            });
        }

        return res.status(200).send({
            status: true,
            message: "User fetched",
            data: apiRes.rows[0]
        });

    } catch (error) {
        console.log("Err while fetching user:", error);

        return res.status(500).send({
            status: false,
            message: "Internal server error!",
            error: error.message
        });
    }
});

// deleteing data by ID 
server.delete("/user/delete/:uid", async (req, res) => {
    const {uid}=req.params;
    console.log("uid:",uid);

    try {
        const apiRes = await pool.query(
            `DELETE FROM users WHERE id=$1 RETURNING *`,
            [uid],
        );

        console.log("Api res:", apiRes);

        if (apiRes.rows.length === 0) {
            return res.status(404).send({
                status: false,
                message: "User not found"
            });
        }

        return res.status(200).send({
            status: true,
            message: "deleted",
            data: apiRes.rows[0]
        });

    } catch (error) {
        console.log("Err while deleting user:", error);

        return res.status(500).send({
            status: false,
            message: "Internal server error!",
            error: error.message
        });
    }
});
server.listen(port, () => {
    console.log("Your Node JS server is running!");
});