import express from "express";
import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();
const port = 3000;
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const corsOptions = {
  origin: "https://spin-wheel-sigma.vercel.app",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: "Content-Type,Authorization",
};

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors(corsOptions));

app.get("/", (req, res) => {
  res.send("Welcome to my server!");
});

app.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM amcspin_users");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching data");
  }
});

app.post("/add_user", async (req, res) => {
  const { fingerprint, uid, status } = req.body;
  try {
    const existingUser = await pool.query(
      "SELECT * FROM amcspin_users WHERE fingerprint = $1 OR uid = $2",
      [fingerprint, uid]
    );
    if (existingUser.rows.length > 0) {
      res.json("user already exists");
    } else {
      const result = await pool.query(
        "INSERT INTO amcspin_users (fingerprint, uid, status) VALUES ($1, $2, $3) RETURNING *",
        [fingerprint, uid, status]
      );
      res.json(result.rows[0]);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding user");
  }
});

app.post("/check_user", async (req, res) => {
  const { fingerprint, uid } = req.body;
  try {
    const existingUser = await pool.query(
      "SELECT * FROM amcspin_users WHERE fingerprint = $1 OR uid = $2",
      [fingerprint, uid]
    );
    if (existingUser.rows.length > 0) {
      res.json({ exists: true, user: existingUser.rows[0] });
    } else {
      res.json({ exists: false });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error checking user");
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
