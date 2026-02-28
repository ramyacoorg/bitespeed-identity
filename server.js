const express = require("express");
require("dotenv").config();

const identifyRoute = require("./routes/identify");

const app = express();
app.use(express.json());

app.use("/identify", identifyRoute);

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});