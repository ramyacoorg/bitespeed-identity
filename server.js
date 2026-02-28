const express = require("express");
require("dotenv").config();

const pool = require("./db");
const identifyRoute = require("./routes/identify");

const app = express();
app.use(express.json());

// Health check route
app.get("/", (req, res) => {
  res.send("Bitespeed Identity API Running 🚀");
});

// Create table automatically if not exists
pool.query(`
  CREATE TABLE IF NOT EXISTS contact (
    id SERIAL PRIMARY KEY,
    phonenumber VARCHAR(20),
    email VARCHAR(255),
    linkedid INTEGER,
    linkprecedence VARCHAR(20),
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletedat TIMESTAMP
  );
`)
.then(() => console.log("Contact table ready"))
.catch(err => console.error("Table creation error:", err));

app.use("/identify", identifyRoute);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});