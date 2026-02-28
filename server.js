const express = require("express");
require("dotenv").config();

const pool = require("./db");
const identifyRoute = require("./routes/identify");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Bitespeed Identity API Running 🚀");
});

const PORT = process.env.PORT || 3000;

// Start server only AFTER DB is ready
async function startServer() {
  try {
    await pool.query(`
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
    `);

    console.log("Contact table ready");

    app.use("/identify", identifyRoute);

    app.listen(PORT, () => {
      console.log(\`Server running on port \${PORT}\`);
    });

  } catch (err) {
    console.error("Database initialization failed:", err.message);
  }
}

startServer();