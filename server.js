import express, { response } from "express";
import morgan from "morgan";
import cors from "cors";
<<<<<<< HEAD
import pool from "./src/db/db.js";
import bcrypt from "bcrypt"
=======
import dbConfig from "./src/db/db.js";

>>>>>>> e66d1b43af7ed3a5ce417d1823b630375bbb7379
const port = 5050;
const server = express();

server.use(cors());
server.use(morgan("dev"));
server.use(express.json());

<<<<<<< HEAD

// // Add user
// server.post("/user/add", async (req, res) => {
//     const { username, email, age } = req.body;

//     console.log("Body:", username, email, age);

//     try {
//         const addQuery = `
//             INSERT INTO users(username, email, age)
//             VALUES($1, $2, $3)
//             RETURNING *
//         `;

//         const apiRes = await pool.query(
//             addQuery,
//             [username, email, age]
//         );

//         console.log("Res:", apiRes.rows);

//         return res.status(200).send({
//             status: true,
//             message: "User Added",
//             data: apiRes.rows[0]
//         });

//     } catch (error) {
//         console.log("Err while adding data:", error);

//         return res.status(500).send({
//             status: false,
//             message: "User failed to add",
//             error: error.message
//         });
//     }
// });


// // Fetch all users
// server.get("/user/fetch/all", async (req, res) => {
//     try {
//         const apiRes = await pool.query("SELECT * FROM users");

//         console.log("Res:", apiRes.rows);

//         return res.status(200).send({
//             status: true,
//             message: "Users",
//             data: apiRes.rows
//         });

//     } catch (error) {
//         console.log("Err while fetching users data:", error);

//         return res.status(500).send({
//             status: false,
//             message: "Internal server error!",
//             error: error.message
//         });
//     }
// });

// // Update user
// server.put("/user/update", async (req, res) => {
//     const { id, username, email, age } = req.body;

//     try {
//         const apiRes = await pool.query(
//             `UPDATE users SET
//                 username = $1,
//                 email = $2,
//                 age = $3
//              WHERE id = $4
//              RETURNING *`,
//             [username, email, age, id]
//         );

//         console.log("Api res:", apiRes.rows);

//         if (apiRes.rows.length === 0) {
//             return res.status(404).send({
//                 status: false,
//                 message: "User not found"
//             });
//         }

//         return res.status(200).send({
//             status: true,
//             message: "User updated",
//             data: apiRes.rows[0]
//         });

//     } catch (error) {
//         console.log("Err while updating user:", error);

//         return res.status(500).send({
//             status: false,
//             message: "Internal server error!",
//             error: error.message
//         });
//     }
// });

// // fetch data by ID 
// server.get("/user/fetch/:uid", async (req, res) => {
//     const {uid}=req.params;
//     console.log("uid:",uid);

//     try {
//         const apiRes = await pool.query(
//             `SELECT * FROM users WHERE id=$1`,
//             [uid],
//         );

//         console.log("Api res:", apiRes);

//         if (apiRes.rows.length === 0) {
//             return res.status(404).send({
//                 status: false,
//                 message: "User not found"
//             });
//         }

//         return res.status(200).send({
//             status: true,
//             message: "User fetched",
//             data: apiRes.rows[0]
//         });

//     } catch (error) {
//         console.log("Err while fetching user:", error);

//         return res.status(500).send({
//             status: false,
//             message: "Internal server error!",
//             error: error.message
//         });
//     }
// });

// // deleteing data by ID 
// server.delete("/user/delete/:uid", async (req, res) => {
//     const {uid}=req.params;
//     console.log("uid:",uid);

//     try {
//         const apiRes = await pool.query(
//             `DELETE FROM users WHERE id=$1 RETURNING *`,
//             [uid],
//         );

//         console.log("Api res:", apiRes);

//         if (apiRes.rows.length === 0) {
//             return res.status(404).send({
//                 status: false,
//                 message: "User not found"
//             });
//         }

//         return res.status(200).send({
//             status: true,
//             message: "deleted",
//             data: apiRes.rows[0]
//         });

//     } catch (error) {
//         console.log("Err while deleting user:", error);

//         return res.status(500).send({
//             status: false,
//             message: "Internal server error!",
//             error: error.message
//         });
//     }
// });

// sign up 


// const bcrypt = require("bcrypt");

// Sign up
server.post("/user/signup", async (req, res) => {
    const { firstname, lastname, username, email, password } = req.body;

    try {
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const addQuery = `
            INSERT INTO users (firstname, lastname, username, email, password)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, firstname, lastname, username, email
        `;

        const apiRes = await pool.query(addQuery, [
            firstname,
            lastname,
            username,
            email,
            hashedPassword
        ]);

        return res.status(201).send({
            status: true,
            message: "User signed-up",
            data: apiRes.rows[0]
        });

    } catch (error) {
        console.log("Err while signing up:", error);

        return res.status(500).send({
            status: false,
            message: "User failed to signup",
            error: error.message
        });
=======
// Note: Add data api...!
server.post("/user/add", async (req, res) => {
  const { username, email, age } = req.body;
  console.log("Body:", username, email, age);

  try {
    const apiRes = await dbConfig.query(
      "INSERT INTO users(username, email, age) VALUES($1, $2, $3) RETURNING *",
      [username, email, age],
    );
    console.log("Res:", apiRes);

    if (apiRes?.rows) {
      return res.status(200).send({
        status: true,
        message: "User added!",
        data: apiRes?.rows[0],
      });
>>>>>>> e66d1b43af7ed3a5ce417d1823b630375bbb7379
    }
  } catch (error) {
    console.log("Err while adding data:", error);
    return res.status(500).send({
      status: false,
      message: "Internal server error!",
    });
  }
});

<<<<<<< HEAD
// Login
server.post("/user/login", async (req, res) => {
    const { email, password } = req.body;

 
    if (!email || !password) {
        return res.status(400).send({
            status: false,
            message: "Email and password are required"
        });
    }

    try {
        
        const query = `
            SELECT id, firstname, lastname, username, email, password
            FROM users
            WHERE email = $1
        `;

        const apiRes = await pool.query(query, [email]);


        if (apiRes.rows.length === 0) {
            return res.status(401).send({
                status: false,
                message: "Invalid email or password"
            });
        }

        const user = apiRes.rows[0];
        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {
            return res.status(401).send({
                status: false,
                message: "Invalid email or password"
            });
        }
        // delete user.password;

        return res.status(200).send({
            status: true,
            message: "Login successful",
            data: user
        });

    } catch (error) {
        console.log("Error while logging in:", error);

        return res.status(500).send({
            status: false,
            message: "Login failed"
        });
=======
// Note: Fetch all users data api...!
server.get("/user/fetch/all", async (req, res) => {
  try {
    const apiRes = await dbConfig.query("SELECT * FROM users");
    console.log("Res:", apiRes?.rows);

    if (apiRes?.rows) {
      return res.status(200).send({
        status: true,
        message: "Users",
        data: apiRes?.rows,
      });
    }
  } catch (error) {
    console.log("Err while fetching users data:", error);
    return res.status(500).send({
      status: false,
      message: "Internal server error!",
    });
  }
});

// Note: Update user api...!
server.put("/user/update", async (req, res) => {
  const { id, username, email, age } = req.body;

  try {
    const apiRes = await dbConfig.query(
      `UPDATE users SET
            username = $1,
            email = $2,
            age = $3
        WHERE id = $4
        RETURNING *`,
      [username, email, age, id],
    );
    console.log("Api res:", apiRes);

    if (apiRes.rows.length == 0) {
      return res.status(404).send({
        status: false,
        message: "User not found!",
      });
    }

    if (apiRes) {
      return res.status(200).send({
        status: true,
        message: "User updated!",
      });
    }
  } catch (error) {
    console.log("Err while updating user:", error);
    return res.status(500).send({
      status: false,
      message: "Internal server error!",
    });
  }
});

// Note: Fetch user by id api...!
server.get("/user/fetch/:uid", async (req, res) => {
  const { uid } = req.params;
  console.log("Uid:", uid);

  try {
    const apiRes = await dbConfig.query("SELECT * FROM users WHERE id = $1", [
      uid,
    ]);
    console.log("Api res:", apiRes);

    if (apiRes.rows.length == 0) {
      return res.status(404).send({
        status: false,
        message: "User not found!",
      });
>>>>>>> e66d1b43af7ed3a5ce417d1823b630375bbb7379
    }

    if (apiRes) {
      return res.status(200).send({
        status: true,
        message: "User fetched",
        data: apiRes.rows[0],
      });
    }
  } catch (error) {
    console.log("Err while fetching user by id:", error);
    return res.status(500).send({
      status: false,
      message: "Internal server error!",
    });
  }
});

<<<<<<< HEAD
server.get("/session", (req,res)=>{
    res.status(200).send(
      "hi"
    )
    // res.redirect("https://github.com/Shahzadaahmed/SMIT_Batch_18/blob/master/Back-End/postgres/server.js")
})

=======
// Note: Delete user api...!
server.delete("/user/delete/:uid", async (req, res) => {
  const { uid } = req.params;
  console.log("Uid:", uid);

  try {
    // For deleting a single user...!
    // const apiRes = await dbConfig.query(
    //   "DELETE FROM users WHERE id = $1 RETURNING *",
    //   [uid],
    // );

    // For deleting all users...!
    const apiRes = await dbConfig.query("DELETE FROM users");
    console.log("Api res:", apiRes);

    if (apiRes.rows.length == 0) {
      return res.status(404).send({
        status: false,
        message: "User not found!",
      });
    }

    if (apiRes) {
      return res.status(200).send({
        status: true,
        message: "User deleted",
      });
    }
  } catch (error) {
    console.log("Err while fetching user by id:", error);
    return res.status(500).send({
      status: false,
      message: "Internal server error!",
    });
  }
});

>>>>>>> e66d1b43af7ed3a5ce417d1823b630375bbb7379
server.listen(port, () => {
  console.log("Your Node JS server is running!");
});